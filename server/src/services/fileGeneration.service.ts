import * as XLSX from 'exceljs';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { uploadToS3, getSignedUrl } from '../utils/storage';
import { env } from '../config/env';

interface DataRow {
  date: string;
  value: number;
  unit: string;
  note?: string;
}

async function getDatasetWithPoints(timeSeriesId: string): Promise<{
  name: string;
  defaultUnit: string;
  rows: DataRow[];
}> {
  const dataset = await prisma.timeSeries.findUnique({
    where: { id: timeSeriesId },
    include: { dataPoints: { orderBy: { date: 'asc' } } },
  });
  if (!dataset) throw new NotFoundError('Dataset not found');

  const rows: DataRow[] = dataset.dataPoints.map(dp => ({
    date: dp.date.toISOString().slice(0, 7), // YYYY-MM
    value: dp.value,
    unit: dp.unitOverride || dataset.defaultUnit,
    note: dp.note || undefined,
  }));

  return { name: dataset.name, defaultUnit: dataset.defaultUnit, rows };
}

export async function generateXLSX(timeSeriesId: string): Promise<string> {
  const { name, rows } = await getDatasetWithPoints(timeSeriesId);

  const workbook = new XLSX.Workbook();
  workbook.creator = 'Wadera Associates';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(name.slice(0, 31));
  sheet.columns = [
    { header: 'Date (YYYY-MM)', key: 'date', width: 15 },
    { header: 'Value', key: 'value', width: 15 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Notes', key: 'note', width: 30 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
  headerRow.alignment = { horizontal: 'center' };

  rows.forEach(row => sheet.addRow(row));

  // Add watermark note
  const lastRow = sheet.lastRow;
  if (lastRow) {
    sheet.addRow({});
    sheet.addRow({ date: '© Wadera Associates Data Intelligence Platform. Licensed use only.' });
  }

  const tmpPath = path.join(os.tmpdir(), `wa_${timeSeriesId}_${Date.now()}.xlsx`);
  await workbook.xlsx.writeFile(tmpPath);

  const key = `downloads/${timeSeriesId}/${Date.now()}.xlsx`;
  const url = await uploadAndGetUrl(tmpPath, key, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  await fs.unlink(tmpPath).catch(() => {});

  return url;
}

export async function generateCSV(timeSeriesId: string): Promise<string> {
  const { name, rows } = await getDatasetWithPoints(timeSeriesId);

  const header = 'Date (YYYY-MM),Value,Unit,Notes';
  const csvRows = rows.map(r => `${r.date},${r.value},${r.unit},"${r.note || ''}"`);
  const content = [header, ...csvRows, '', '# © Wadera Associates Data Intelligence Platform'].join('\n');

  const tmpPath = path.join(os.tmpdir(), `wa_${timeSeriesId}_${Date.now()}.csv`);
  await fs.writeFile(tmpPath, content, 'utf-8');

  const key = `downloads/${timeSeriesId}/${Date.now()}.csv`;
  const url = await uploadAndGetUrl(tmpPath, key, 'text/csv');
  await fs.unlink(tmpPath).catch(() => {});

  return url;
}

export async function generatePDF(timeSeriesId: string): Promise<string> {
  const { name, rows, defaultUnit } = await getDatasetWithPoints(timeSeriesId);

  // Use PDFKit for a clean PDF report
  const PDFDocument = (await import('pdfkit')).default;
  const tmpPath = path.join(os.tmpdir(), `wa_${timeSeriesId}_${Date.now()}.pdf`);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = require('fs').createWriteStream(tmpPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).fillColor('#1A365D').text('Wadera Associates', { align: 'center' });
    doc.fontSize(14).fillColor('#2B6CB0').text('Data Intelligence Platform', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).fillColor('#1A365D').text(name, { align: 'center' });
    doc.fontSize(10).fillColor('#718096').text(`Unit: ${defaultUnit} | Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Table header
    doc.fontSize(10).fillColor('#FFFFFF');
    doc.rect(50, doc.y, 495, 20).fill('#1A365D');
    doc.fillColor('#FFFFFF').text('Date', 55, doc.y - 15);
    doc.text('Value', 200, doc.y - 15);
    doc.text('Unit', 350, doc.y - 15);
    doc.moveDown(0.5);

    // Data rows (first 100 only)
    let yPos = doc.y;
    let isAlt = false;
    for (const row of rows.slice(0, 100)) {
      if (yPos > 750) {
        doc.addPage();
        yPos = 50;
      }
      if (isAlt) doc.rect(50, yPos - 3, 495, 16).fill('#F7FAFC');
      doc.fillColor('#2D3748').fontSize(9);
      doc.text(row.date, 55, yPos);
      doc.text(String(row.value), 200, yPos);
      doc.text(row.unit, 350, yPos);
      yPos += 16;
      isAlt = !isAlt;
    }

    if (rows.length > 100) {
      doc.moveDown().fontSize(9).fillColor('#718096')
        .text(`... and ${rows.length - 100} more rows. Download XLSX for complete data.`);
    }

    doc.moveDown(2).fontSize(8).fillColor('#A0AEC0')
      .text('© Wadera Associates Data Intelligence Platform. Licensed use only. Redistribution prohibited.', { align: 'center' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const key = `downloads/${timeSeriesId}/${Date.now()}.pdf`;
  const url = await uploadAndGetUrl(tmpPath, key, 'application/pdf');
  await fs.unlink(tmpPath).catch(() => {});

  return url;
}

async function uploadAndGetUrl(filePath: string, key: string, contentType: string): Promise<string> {
  if (env.AWS_BUCKET_NAME) {
    const buffer = await fs.readFile(filePath);
    await uploadToS3(key, buffer, contentType);
    return await getSignedUrl(key, 300); // 5-minute signed URL
  } else {
    // Local dev: serve static
    const localDir = path.join(process.cwd(), 'public', 'downloads');
    await fs.mkdir(localDir, { recursive: true });
    const filename = path.basename(key);
    await fs.copyFile(filePath, path.join(localDir, filename));
    return `${env.FRONTEND_URL}/downloads/${filename}`;
  }
}
