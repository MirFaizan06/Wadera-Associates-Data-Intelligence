import axios from 'axios';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface ExchangeRateResponse {
  rates: Record<string, number>;
}

export async function updateExchangeRates(): Promise<void> {
  const url = env.EXCHANGE_RATE_API_URL;
  const { data } = await axios.get<ExchangeRateResponse>(url, {
    timeout: 10000,
    headers: env.EXCHANGE_RATE_API_KEY ? { 'apikey': env.EXCHANGE_RATE_API_KEY } : {},
  });

  const currencies = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CAD', 'AUD'];

  for (const [currency, rate] of Object.entries(data.rates)) {
    if (currencies.includes(currency)) {
      await prisma.exchangeRate.upsert({
        where: { fromCurrency_toCurrency: { fromCurrency: 'INR', toCurrency: currency } },
        update: { rate },
        create: { fromCurrency: 'INR', toCurrency: currency, rate },
      });
    }
  }

  logger.info('Exchange rates updated', { currencies: currencies.length });
}
