import cron from 'node-cron';
import { logger } from '../utils/logger';
import { updateExchangeRates } from './exchangeRates.job';
import { cleanExpiredSessions } from './cleanSessions.job';
import { cleanExpiredOtps } from './cleanOtps.job';

export function startCronJobs() {
  // Update exchange rates every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running exchange rate update job');
    await updateExchangeRates().catch(err => logger.error('Exchange rate job failed', { err }));
  });

  // Clean expired sessions every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running session cleanup job');
    await cleanExpiredSessions().catch(err => logger.error('Session cleanup failed', { err }));
  });

  // Clean expired OTPs every hour
  cron.schedule('30 * * * *', async () => {
    logger.info('Running OTP cleanup job');
    await cleanExpiredOtps().catch(err => logger.error('OTP cleanup failed', { err }));
  });

  logger.info('Cron jobs started');
}
