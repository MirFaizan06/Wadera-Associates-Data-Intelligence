import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { LicenseError, NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export type LicensePermission = 'VIEW' | 'DOWNLOAD' | 'API_ACCESS';

export async function checkUserLicense(
  userId: string,
  timeSeriesId: string,
  permission: LicensePermission
): Promise<boolean> {
  const now = new Date();

  const licenses = await prisma.licenseAssignment.findMany({
    where: {
      userId,
      isActive: true,
      validFrom: { lte: now },
      OR: [{ validTo: null }, { validTo: { gte: now } }],
    },
    include: { licenseType: true },
  });

  for (const lic of licenses) {
    const perms = lic.licenseType.permissions as string[];
    if (!perms.includes(permission)) continue;

    // Check dataset restriction
    if (lic.datasetIds) {
      const ids = lic.datasetIds as string[];
      if (ids.length > 0 && !ids.includes(timeSeriesId)) continue;
    }

    return true;
  }

  return false;
}

export async function assignLicense(
  userId: string,
  licenseTypeId: string,
  datasetIds?: string[],
  grantedById?: string
): Promise<void> {
  const licType = await prisma.licenseType.findUnique({ where: { id: licenseTypeId } });
  if (!licType) throw new NotFoundError('License type not found');

  const now = new Date();
  const validTo = licType.validDays
    ? new Date(now.getTime() + licType.validDays * 24 * 60 * 60 * 1000)
    : null;

  await prisma.licenseAssignment.create({
    data: {
      userId,
      licenseTypeId,
      validFrom: now,
      validTo,
      isActive: true,
      datasetIds: datasetIds ?? Prisma.JsonNull,
      grantedById: grantedById || null,
    },
  });

  logger.info('License assigned', { userId, licenseTypeId, validTo });
}

export async function revokeLicense(
  licenseId: string,
  reason?: string
): Promise<void> {
  const lic = await prisma.licenseAssignment.findUnique({ where: { id: licenseId } });
  if (!lic) throw new NotFoundError('License not found');

  await prisma.licenseAssignment.update({
    where: { id: licenseId },
    data: { isActive: false, revokedAt: new Date(), revokedReason: reason || 'Revoked by admin' },
  });

  logger.info('License revoked', { licenseId, reason });
}

export async function getUserLicenses(userId: string) {
  return prisma.licenseAssignment.findMany({
    where: { userId },
    include: { licenseType: { select: { name: true, permissions: true, maxDevices: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
