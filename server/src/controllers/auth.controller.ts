import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { env } from '../config/env';
import path from 'path';
import fs from 'fs';
import { uploadToR2 } from '../utils/storage';
import { prisma } from '../utils/prisma';

const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase and number'
  ),
  fullName: z.string().min(2).max(100),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const otpSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().length(6),
  type: z.enum(['REGISTER', 'LOGIN', 'RESET_PASSWORD']),
});

const resetPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().length(6),
  newPassword: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase and number'
  ),
});

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.registerUser(data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.loginUser(data);

    if (result.token) {
      res.cookie('token', result.token, cookieOptions);
      res.json({ success: true, data: { message: 'Logged in successfully' } });
    } else {
      res.json({ success: true, data: { requiresOtp: true, message: 'OTP sent to your email' } });
    }
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = otpSchema.parse(req.body);
    const result = await authService.verifyOtp(data.email, data.otp, data.type);
    res.cookie('token', result.token, cookieOptions);
    res.json({ success: true, data: { message: 'Verified successfully' } });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.json({ success: true, data: { message: 'Logged out successfully' } });
};

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getUserProfile(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      fullName: z.string().min(2).max(100).optional(),
      phone: z.string().optional(),
    });
    const data = schema.parse(req.body);
    await authService.updateUserProfile(req.user!.id, data);
    res.json({ success: true, data: { message: 'Profile updated' } });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      oldPassword: z.string().min(1),
      newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    });
    const { oldPassword, newPassword } = schema.parse(req.body);
    await authService.changePassword(req.user!.id, oldPassword, newPassword);
    res.json({ success: true, data: { message: 'Password changed. All sessions invalidated.' } });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = z.object({ email: z.string().email().toLowerCase() }).parse(req.body);
    const result = await authService.requestPasswordReset(email);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(data.email, data.otp, data.newPassword);
    res.json({ success: true, data: { message: 'Password reset successfully. Please log in.' } });
  } catch (err) {
    next(err);
  }
};

export const uploadProfilePicture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
      return;
    }

    const userId = req.user!.id;
    const file = req.file;
    const mimeToExt: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    const ext = mimeToExt[file.mimetype] ?? '.jpg';
    let profilePicture: string;

    if (env.NODE_ENV === 'production' || (env.R2_BUCKET_NAME && env.R2_ACCESS_KEY_ID !== 'dev')) {
      // Upload to Cloudflare R2
      const key = `profile-pictures/${userId}${ext}`;
      await uploadToR2(key, file.buffer, file.mimetype);
      profilePicture = `${env.R2_PUBLIC_URL}/${key}`;
    } else {
      // Save locally
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `${userId}${ext}`;
      fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
      profilePicture = `/uploads/avatars/${filename}`;
    }

    await prisma.user.update({ where: { id: userId }, data: { profilePicture } });
    res.json({ success: true, data: { profilePicture } });
  } catch (err) {
    next(err);
  }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      email: z.string().email().toLowerCase(),
      type: z.enum(['REGISTER', 'LOGIN', 'RESET_PASSWORD']),
    });
    const { email, type } = schema.parse(req.body);
    await authService.resendOtp(email, type);
    res.json({ success: true, data: { message: 'OTP sent' } });
  } catch (err) {
    next(err);
  }
};
