import { prisma } from './prisma';
import { logger } from './logger';

export async function convertFromINR(amountINR: number, toCurrency: string): Promise<number> {
  if (toCurrency === 'INR') return amountINR;

  const rate = await prisma.exchangeRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency: 'INR', toCurrency } },
  });

  if (!rate) {
    logger.warn('Exchange rate not found', { toCurrency });
    return amountINR;
  }

  return Math.round(amountINR * rate.rate * 100) / 100;
}

export async function getAllRates(): Promise<Record<string, number>> {
  const rates = await prisma.exchangeRate.findMany();
  const result: Record<string, number> = { INR: 1 };
  for (const r of rates) {
    result[r.toCurrency] = r.rate;
  }
  return result;
}
