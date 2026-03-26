import { Request, Response, NextFunction } from 'express';
import { getAllRates } from '../utils/currency';

export const getExchangeRates = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rates = await getAllRates();
    res.json({ success: true, data: rates });
  } catch (err) { next(err); }
};
