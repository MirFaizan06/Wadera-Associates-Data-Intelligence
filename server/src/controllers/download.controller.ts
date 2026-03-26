import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { verifyDownloadToken } from '../utils/token';
import { checkUserLicense } from '../services/license.service';
import { generateXLSX, generateCSV, generatePDF } from '../services/fileGeneration.service';
import { prisma } from '../utils/prisma';
import { AuthError, LicenseError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

type DownloadFormat = 'XLSX' | 'CSV' | 'PDF';

async function resolveAccess(req: Request, timeSeriesId: string): Promise<{ email: string | null; userId: string | null }> {
  // Option 1: Authenticated user with license
  if (req.user) {
    const hasLicense = await checkUserLicense(req.user.id, timeSeriesId, 'DOWNLOAD');
    if (hasLicense) return { email: req.user.email, userId: req.user.id };
  }

  // Option 2: Download token (guest or time-limited)
  const token = req.query.token as string | undefined;
  if (token) {
    const decoded = verifyDownloadToken(token);
    if (decoded.timeSeriesId !== timeSeriesId) throw new LicenseError('Token not valid for this dataset');
    return { email: decoded.guestEmail || null, userId: null };
  }

  throw new LicenseError('No valid license or download token');
}

export const download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const formatSchema = z.enum(['XLSX', 'CSV', 'PDF']);
    const format = formatSchema.parse(req.params.format.toUpperCase()) as DownloadFormat;
    const timeSeriesId = req.params.id;

    const { email, userId } = await resolveAccess(req, timeSeriesId);

    let fileUrl: string;
    switch (format) {
      case 'XLSX': fileUrl = await generateXLSX(timeSeriesId); break;
      case 'CSV': fileUrl = await generateCSV(timeSeriesId); break;
      case 'PDF': fileUrl = await generatePDF(timeSeriesId); break;
    }

    // Log download
    await prisma.downloadLog.create({
      data: {
        userId: userId || undefined,
        guestEmail: email && !userId ? email : undefined,
        timeSeriesId,
        format,
        ipAddress: req.ip,
      },
    });

    logger.info('File downloaded', { timeSeriesId, format, userId, email });
    res.json({ success: true, data: { url: fileUrl } });
  } catch (err) { next(err); }
};
