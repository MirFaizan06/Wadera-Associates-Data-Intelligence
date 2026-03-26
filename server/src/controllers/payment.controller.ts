import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as paymentService from '../services/payment.service';

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      timeSeriesId: z.string().cuid(),
      guestEmail: z.string().email().optional(),
      currency: z.string().length(3).optional(),
    });
    const { timeSeriesId, guestEmail, currency } = schema.parse(req.body);

    const result = await paymentService.createOrder({
      timeSeriesId,
      userId: req.user?.id,
      guestEmail,
      currency,
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string(),
    });
    const data = schema.parse(req.body);
    const result = await paymentService.verifyPayment(data);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getPurchaseHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentService.getPurchaseHistory(req.user!.id, page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
