import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getPurchaseHistory } from '../controllers/payment.controller';
import { createOrder, verifyPayment } from '../controllers/payment.controller';
import { download } from '../controllers/download.controller';
import { getUserLicenses } from '../controllers/license.controller';
import { paymentLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// All user routes require authentication
router.use(protect);

// Purchases
router.get('/purchases', getPurchaseHistory);

// Payments
router.post('/payments/order', paymentLimiter, createOrder);
router.post('/payments/verify', paymentLimiter, verifyPayment);

// Downloads
router.get('/datasets/:id/download/:format', download);

// Licenses
router.get('/licenses', getUserLicenses);

export default router;
