import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/errors';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: undefined,
  handler: (_req, _res, next) => {
    next(new AppError('Too many login attempts. Try again in 15 minutes.', 429, 'TOO_MANY_REQUESTS'));
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  handler: (_req, _res, next) => {
    next(new AppError('Too many OTP requests. Try again in 10 minutes.', 429, 'TOO_MANY_OTP_REQUESTS'));
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  handler: (_req, _res, next) => {
    next(new AppError('Too many payment attempts. Try again in 1 hour.', 429, 'TOO_MANY_PAYMENT_REQUESTS'));
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
