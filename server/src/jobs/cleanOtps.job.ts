import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export async function cleanExpiredOtps(): Promise<void> {
  const result = await prisma.otpCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { isUsed: true },
      ],
    },
  });
  logger.info('Expired OTPs cleaned', { count: result.count });
}
