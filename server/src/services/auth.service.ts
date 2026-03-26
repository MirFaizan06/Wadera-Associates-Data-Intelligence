import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { signToken } from '../utils/token';
import { generateOtp, getOtpExpiry } from '../utils/otp';
import { sendOtpEmail, sendWelcomeEmail } from '../utils/email';
import {
  AuthError, ConflictError, NotFoundError, ValidationError, AppError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput): Promise<{ message: string }> {
  const { email, password, fullName, phone } = input;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.deletedAt) {
      throw new ConflictError('This email was previously deleted. Contact support.', 'EMAIL_DELETED');
    }
    throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, phone, isEmailVerified: false },
  });

  // Send OTP
  const otp = generateOtp();
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      email,
      code: otp,
      type: 'REGISTER',
      expiresAt: getOtpExpiry(),
    },
  });

  await sendOtpEmail(email, otp);

  // Merge any guest purchases
  await mergeguestPurchases(email, user.id);

  logger.info('User registered', { userId: user.id, email });
  return { message: 'Registration successful. Check your email for the verification code.' };
}

async function mergeguestPurchases(email: string, userId: string): Promise<void> {
  await prisma.purchase.updateMany({
    where: { guestEmail: email, userId: null },
    data: { userId },
  });
}

export async function verifyOtp(email: string, otp: string, type: string): Promise<{ token: string }> {
  const record = await prisma.otpCode.findFirst({
    where: {
      email,
      code: otp,
      type,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    throw new ValidationError('Invalid or expired OTP', 'INVALID_OTP');
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { isUsed: true },
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError('User not found');

  if (type === 'REGISTER' || type === 'LOGIN') {
    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });
  }

  if (type === 'REGISTER') {
    await sendWelcomeEmail(email, user.fullName || email).catch(() => {});
  }

  const token = signToken({ userId: user.id, email: user.email });
  logger.info('OTP verified', { email, type });
  return { token };
}

export async function loginUser(input: LoginInput): Promise<{ token?: string; requiresOtp?: boolean }> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email, deletedAt: null },
    include: { role: true },
  });

  if (!user || !user.passwordHash) {
    logger.warn('Failed login attempt', { email });
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    logger.warn('Failed login attempt - wrong password', { email });
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (!user.isEmailVerified) {
    // Resend OTP
    const otp = generateOtp();
    await prisma.otpCode.create({
      data: { userId: user.id, email, code: otp, type: 'LOGIN', expiresAt: getOtpExpiry() },
    });
    await sendOtpEmail(email, otp);
    return { requiresOtp: true };
  }

  const token = signToken({ userId: user.id, email: user.email });
  logger.info('User logged in', { userId: user.id, email });
  return { token };
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email, deletedAt: null } });
  if (!user) {
    // Return same message to prevent email enumeration
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  const otp = generateOtp();
  await prisma.otpCode.create({
    data: { userId: user.id, email, code: otp, type: 'RESET_PASSWORD', expiresAt: getOtpExpiry() },
  });

  const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`;

  const { sendPasswordResetEmail } = await import('../utils/email');
  await sendPasswordResetEmail(email, resetUrl);

  return { message: 'If that email exists, a reset link has been sent.' };
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  const record = await prisma.otpCode.findFirst({
    where: { email, code: otp, type: 'RESET_PASSWORD', isUsed: false, expiresAt: { gt: new Date() } },
  });

  if (!record) throw new ValidationError('Invalid or expired reset code', 'INVALID_OTP');

  await prisma.otpCode.update({ where: { id: record.id }, data: { isUsed: true } });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { email }, data: { passwordHash } });

  // Invalidate all sessions
  await prisma.session.deleteMany({ where: { user: { email } } });

  logger.info('Password reset', { email });
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      profilePicture: true,
      isEmailVerified: true,
      createdAt: true,
      role: { select: { name: true, permissions: true } },
    },
  });

  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function updateUserProfile(userId: string, data: { fullName?: string; phone?: string }): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data });
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) throw new AppError('Cannot change password for this account', 400, 'NO_PASSWORD');

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) throw new AuthError('Incorrect current password', 'WRONG_PASSWORD');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Invalidate all other sessions
  await prisma.session.deleteMany({ where: { userId } });
  logger.info('Password changed', { userId });
}

export async function resendOtp(email: string, type: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email, deletedAt: null } });
  if (!user) return; // Silent to prevent email enumeration

  // Rate limit: max 3 OTPs in 30 minutes
  const recentOtps = await prisma.otpCode.count({
    where: { email, type, createdAt: { gt: new Date(Date.now() - 30 * 60 * 1000) } },
  });

  if (recentOtps >= 3) {
    throw new AppError('Too many OTP requests. Try again in 30 minutes.', 429, 'TOO_MANY_OTP');
  }

  const otp = generateOtp();
  await prisma.otpCode.create({
    data: { userId: user.id, email, code: otp, type, expiresAt: getOtpExpiry() },
  });

  await sendOtpEmail(email, otp);
}
