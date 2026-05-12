import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';
import * as XLSX from 'exceljs';
import slugify from '../utils/slugify';

export interface CreateDatasetInput {
  name: string;
  description?: string;
  defaultUnit: string;
  priceINR: number;
  category?: string;
  tags?: string[];
  source?: string;
  region?: string;
  metadata?: Record<string, unknown>;
  createdById: string;
}

export interface DataPointInput {
  date: string; // YYYY-MM
  value: number;    // LocalCurrency/Unit
  usdValue?: number; // USD/Unit
  note?: string;
}

export async function createDataset(input: CreateDatasetInput) {
  const slug = await generateUniqueSlug(input.name);

  const dataset = await prisma.timeSeries.create({
    data: {
      slug,
      name: input.name,
      description: input.description,
      defaultUnit: input.defaultUnit,
      priceINR: input.priceINR,
      category: input.category,
      tags: input.tags || [],
      source: input.source,
      region: input.region,
      metadata: (input.metadata || {}) as Prisma.InputJsonValue,
      createdById: input.createdById,
    },
  });

  logger.info('Dataset created', { id: dataset.id, slug: dataset.slug });
  return dataset;
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let counter = 1;

  while (await prisma.timeSeries.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }

  return slug;
}

export async function getPublicDatasets(params: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'priceINR';
  order?: 'asc' | 'desc';
}) {
  const { page = 1, limit = 20, category, search, sortBy = 'createdAt', order = 'desc' } = params;
  const skip = (page - 1) * limit;

  const where = {
    isVisible: true,
    ...(category && { category }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { tags: { array_contains: search } },
      ],
    }),
  };

  const [datasets, total] = await Promise.all([
    prisma.timeSeries.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        defaultUnit: true,
        priceINR: true,
        category: true,
        tags: true,
        isFeatured: true,
        coverImage: true,
        _count: { select: { dataPoints: true } },
        updatedAt: true,
      },
    }),
    prisma.timeSeries.count({ where }),
  ]);

  return {
    datasets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDatasetBySlug(slug: string, includeData = false) {
  const dataset = await prisma.timeSeries.findUnique({
    where: { slug, isVisible: true },
    include: includeData
      ? {
          dataPoints: {
            orderBy: { date: 'asc' },
            select: { date: true, value: true, usdValue: true, unitOverride: true, note: true },
          },
        }
      : undefined,
  });

  if (!dataset) throw new NotFoundError('Dataset not found');
  return dataset;
}

export async function updateDataset(id: string, data: Partial<CreateDatasetInput>): Promise<void> {
  await prisma.timeSeries.update({ where: { id }, data: data as Prisma.TimeSeriesUpdateInput });
}

export async function updateCoverImage(id: string, url: string): Promise<void> {
  await prisma.timeSeries.update({ where: { id }, data: { coverImage: url } });
}

export async function deleteDataset(id: string): Promise<void> {
  await prisma.timeSeries.update({ where: { id }, data: { isVisible: false } });
}

export async function appendDataPoints(timeSeriesId: string, points: DataPointInput[]): Promise<void> {
  const dataset = await prisma.timeSeries.findUnique({ where: { id: timeSeriesId } });
  if (!dataset) throw new NotFoundError('Dataset not found');

  for (const point of points) {
    const date = new Date(point.date + '-01');
    await prisma.dataPoint.upsert({
      where: { timeSeriesId_date: { timeSeriesId, date } },
      update: { value: point.value, usdValue: point.usdValue ?? null, note: point.note },
      create: { timeSeriesId, date, value: point.value, usdValue: point.usdValue ?? null, note: point.note },
    });
  }

  logger.info('Data points appended', { timeSeriesId, count: points.length });
}

function cellToYearMonth(cellValue: unknown): string | null {
  if (!cellValue) return null;
  // ExcelJS returns date-formatted cells as JS Date objects
  if (cellValue instanceof Date) {
    const y = cellValue.getFullYear();
    const m = String(cellValue.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  const s = String(cellValue).trim();
  // Accept YYYY-MM or YYYY-MM-DD (truncate to month)
  if (/^\d{4}-\d{2}(-\d{2})?/.test(s)) return s.slice(0, 7);
  return null;
}

export async function importFromXLSX(timeSeriesId: string, buffer: Buffer): Promise<{ imported: number; errors: string[] }> {
  const workbook = new XLSX.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);

  const sheet = workbook.worksheets[0];
  const errors: string[] = [];
  let imported = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const dateStr = cellToYearMonth(row.getCell(1).value);
    const valueCell = row.getCell(2).value; // LocalCurrency/Unit

    if (!dateStr || !valueCell) {
      errors.push(`Row ${rowNumber}: Missing date (YYYY-MM) or LocalCurrency/Unit value`);
      return;
    }

    const value = Number(valueCell);
    if (isNaN(value)) {
      errors.push(`Row ${rowNumber}: Invalid LocalCurrency/Unit value "${valueCell}"`);
      return;
    }

    const usdCell = row.getCell(3).value; // USD/Unit (optional)
    if (usdCell !== null && usdCell !== undefined && usdCell !== '') {
      const usd = Number(usdCell);
      if (isNaN(usd)) {
        errors.push(`Row ${rowNumber}: Invalid USD/Unit value "${usdCell}"`);
        return;
      }
    }
  });

  if (errors.length === 0) {
    const points: DataPointInput[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const dateStr = cellToYearMonth(row.getCell(1).value)!;
      const value = Number(row.getCell(2).value);
      const usdCell = row.getCell(3).value;
      const usdValue = (usdCell !== null && usdCell !== undefined && usdCell !== '') ? Number(usdCell) : undefined;
      const note = row.getCell(4).value ? String(row.getCell(4).value) : undefined;
      points.push({ date: dateStr, value, usdValue, note });
    });

    await appendDataPoints(timeSeriesId, points);
    imported = points.length;
  }

  return { imported, errors };
}

export async function getCategories(): Promise<string[]> {
  const result = await prisma.timeSeries.findMany({
    where: { isVisible: true, category: { not: null } },
    select: { category: true },
    distinct: ['category'],
  });
  return result.map(r => r.category!).filter(Boolean);
}

export async function getFeaturedDatasets() {
  return prisma.timeSeries.findMany({
    where: { isVisible: true, isFeatured: true },
    take: 6,
    select: {
      id: true, slug: true, name: true, description: true,
      defaultUnit: true, priceINR: true, category: true,
      _count: { select: { dataPoints: true } },
    },
  });
}
