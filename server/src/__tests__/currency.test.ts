import { prismaMock } from './setup';
import { convertFromINR, getAllRates } from '../utils/currency';

describe('Currency Utility', () => {
  describe('convertFromINR', () => {
    it('returns same amount for INR', async () => {
      const result = await convertFromINR(1000, 'INR');
      expect(result).toBe(1000);
    });

    it('converts INR to USD using exchange rate', async () => {
      prismaMock.exchangeRate.findUnique.mockResolvedValue({
        id: '1',
        fromCurrency: 'INR',
        toCurrency: 'USD',
        rate: 0.012,
        updatedAt: new Date(),
      });

      const result = await convertFromINR(1000, 'USD');
      expect(result).toBe(12); // 1000 * 0.012 = 12
    });

    it('returns INR amount if exchange rate not found', async () => {
      prismaMock.exchangeRate.findUnique.mockResolvedValue(null);
      const result = await convertFromINR(1000, 'XYZ');
      expect(result).toBe(1000);
    });
  });

  describe('getAllRates', () => {
    it('includes INR base rate of 1', async () => {
      prismaMock.exchangeRate.findMany.mockResolvedValue([]);
      const rates = await getAllRates();
      expect(rates.INR).toBe(1);
    });

    it('includes fetched exchange rates', async () => {
      prismaMock.exchangeRate.findMany.mockResolvedValue([
        { id: '1', fromCurrency: 'INR', toCurrency: 'USD', rate: 0.012, updatedAt: new Date() },
        { id: '2', fromCurrency: 'INR', toCurrency: 'EUR', rate: 0.011, updatedAt: new Date() },
      ] as never);

      const rates = await getAllRates();
      expect(rates.USD).toBe(0.012);
      expect(rates.EUR).toBe(0.011);
      expect(rates.INR).toBe(1);
    });
  });
});
