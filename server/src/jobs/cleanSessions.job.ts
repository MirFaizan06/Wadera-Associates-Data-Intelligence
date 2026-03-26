import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export async function cleanExpiredSessions(): Promise<void> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  logger.info('Expired sessions cleaned', { count: result.count });
}
