import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { PaymentError, NotFoundError, ValidationError } from '../utils/errors';
import { signDownloadToken } from '../utils/token';
import { assignLicense } from './license.service';
import { sendOrderConfirmationEmail } from '../utils/email';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const razorpay = env.RAZORPAY_KEY_ID ? new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
}) : null;

export async function createOrder(params: {
  timeSeriesId: string;
  userId?: string;
  guestEmail?: string;
  currency?: string;
}) {
  const { timeSeriesId, userId, guestEmail, currency = 'INR' } = params;

  if (!userId && !guestEmail) {
    throw new ValidationError('Either userId or guestEmail required');
  }

  const dataset = await prisma.timeSeries.findUnique({
    where: { id: timeSeriesId, isVisible: true },
    select: { id: true, name: true, priceINR: true },
  });
  if (!dataset) throw new NotFoundError('Dataset not found');

  const amountINR = dataset.priceINR;
  const amountPaise = Math.round(amountINR * 100);

  if (!razorpay) {
    throw new PaymentError('Payment gateway not configured', 'GATEWAY_NOT_CONFIGURED');
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `wa_${Date.now()}`,
    notes: {
      timeSeriesId,
      userId: userId || '',
      guestEmail: guestEmail || '',
    },
  });

  const purchase = await prisma.purchase.create({
    data: {
      userId: userId || null,
      guestEmail: guestEmail || null,
      timeSeriesId,
      amountINR,
      currency,
      amountDisplay: amountINR,
      razorpayOrderId: razorpayOrder.id,
      status: 'PENDING',
    },
  });

  return {
    orderId: razorpayOrder.id,
    purchaseId: purchase.id,
    amount: amountPaise,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID,
    datasetName: dataset.name,
  };
}

export async function verifyPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ downloadUrl: string; purchaseId: string }> {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  // Verify signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    logger.warn('Invalid payment signature', { razorpayOrderId });
    throw new PaymentError('Invalid payment signature', 'INVALID_SIGNATURE');
  }

  const purchase = await prisma.purchase.findUnique({
    where: { razorpayOrderId },
    include: { timeSeries: { select: { id: true, name: true } }, user: { select: { email: true, fullName: true } } },
  });

  if (!purchase) throw new NotFoundError('Purchase not found');
  if (purchase.status === 'SUCCESS') {
    // Idempotent - already processed
    return { downloadUrl: `${env.FRONTEND_URL}/download/${purchase.downloadToken}`, purchaseId: purchase.id };
  }

  // Generate download token
  const downloadToken = signDownloadToken({
    purchaseId: purchase.id,
    timeSeriesId: purchase.timeSeriesId,
    guestEmail: purchase.guestEmail || undefined,
  });

  const downloadTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Update purchase
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      razorpayPaymentId,
      razorpaySignature,
      status: 'SUCCESS',
      downloadToken,
      downloadTokenExpiry,
      purchasedAt: new Date(),
    },
  });

  // Assign license to user
  if (purchase.userId) {
    const downloadLicenseType = await prisma.licenseType.findUnique({
      where: { name: 'Download Enabled' },
    });
    if (downloadLicenseType) {
      await assignLicense(purchase.userId, downloadLicenseType.id, [purchase.timeSeriesId]);
    }
  } else if (purchase.guestEmail) {
    // Guest: create temporary user placeholder or just rely on token
    logger.info('Guest purchase completed', { guestEmail: purchase.guestEmail, purchaseId: purchase.id });
  }

  const downloadUrl = `${env.FRONTEND_URL}/download/${downloadToken}`;
  const email = purchase.user?.email || purchase.guestEmail || '';
  const name = purchase.user?.fullName || purchase.guestEmail || 'Customer';

  await sendOrderConfirmationEmail(
    email, name, purchase.timeSeries.name, purchase.amountINR, razorpayOrderId, downloadUrl
  ).catch(err => logger.warn('Failed to send order email', { err }));

  logger.info('Payment verified', { purchaseId: purchase.id, email });
  return { downloadUrl, purchaseId: purchase.id };
}

export async function getPurchaseHistory(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId, status: 'SUCCESS' },
      skip,
      take: limit,
      orderBy: { purchasedAt: 'desc' },
      include: {
        timeSeries: { select: { name: true, slug: true, defaultUnit: true } },
      },
    }),
    prisma.purchase.count({ where: { userId, status: 'SUCCESS' } }),
  ]);

  return { purchases, total, page, limit };
}
