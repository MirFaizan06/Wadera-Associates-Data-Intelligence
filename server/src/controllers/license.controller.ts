import { Request, Response, NextFunction } from 'express';
import { getUserLicenses as getLicenses, assignLicense, revokeLicense } from '../services/license.service';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

export const getUserLicenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const licenses = await getLicenses(req.user!.id);
    res.json({ success: true, data: licenses });
  } catch (err) { next(err); }
};

export const adminAssignLicense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      userId: z.string().cuid(),
      licenseTypeId: z.string().cuid(),
      datasetIds: z.array(z.string()).optional(),
    });
    const { userId, licenseTypeId, datasetIds } = schema.parse(req.body);
    await assignLicense(userId, licenseTypeId, datasetIds, req.user!.id);
    res.status(201).json({ success: true, data: { message: 'License assigned' } });
  } catch (err) { next(err); }
};

export const adminRevokeLicense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    await revokeLicense(req.params.id, reason);
    res.json({ success: true, data: { message: 'License revoked' } });
  } catch (err) { next(err); }
};

export const adminGetLicenseTypes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const types = await prisma.licenseType.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: types });
  } catch (err) { next(err); }
};
