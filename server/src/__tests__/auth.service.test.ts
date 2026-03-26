import bcrypt from 'bcryptjs';
import { prismaMock } from './setup';
import * as authService from '../services/auth.service';

// Mock email utility
jest.mock('../utils/email', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Auth Service', () => {
  describe('registerUser', () => {
    it('throws ConflictError if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        deletedAt: null,
      } as never);

      await expect(authService.registerUser({
        email: 'test@example.com',
        password: 'Password1',
        fullName: 'Test User',
      })).rejects.toMatchObject({ code: 'EMAIL_EXISTS', statusCode: 409 });
    });

    it('creates user and sends OTP', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'new-id',
        email: 'new@example.com',
        fullName: 'New User',
      } as never);
      prismaMock.otpCode.create.mockResolvedValue({} as never);
      prismaMock.purchase.updateMany.mockResolvedValue({ count: 0 });

      const result = await authService.registerUser({
        email: 'new@example.com',
        password: 'Password1',
        fullName: 'New User',
      });

      expect(result.message).toContain('verification code');
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.otpCode.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('loginUser', () => {
    it('throws AuthError for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(authService.loginUser({
        email: 'noone@example.com',
        password: 'Password1',
      })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
    });

    it('throws AuthError for wrong password', async () => {
      const hash = await bcrypt.hash('correct-password', 12);
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        passwordHash: hash,
        isEmailVerified: true,
        deletedAt: null,
        role: null,
      } as never);

      await expect(authService.loginUser({
        email: 'user@example.com',
        password: 'wrong-password',
      })).rejects.toMatchObject({ statusCode: 401 });
    });

    it('returns token for valid credentials with verified email', async () => {
      const hash = await bcrypt.hash('Password1', 12);
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        passwordHash: hash,
        isEmailVerified: true,
        deletedAt: null,
        role: null,
      } as never);

      const result = await authService.loginUser({
        email: 'user@example.com',
        password: 'Password1',
      });

      expect(result.token).toBeDefined();
      expect(result.requiresOtp).toBeUndefined();
    });

    it('requires OTP for unverified email', async () => {
      const hash = await bcrypt.hash('Password1', 12);
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        passwordHash: hash,
        isEmailVerified: false,
        deletedAt: null,
        role: null,
      } as never);
      prismaMock.otpCode.create.mockResolvedValue({} as never);

      const result = await authService.loginUser({
        email: 'user@example.com',
        password: 'Password1',
      });

      expect(result.requiresOtp).toBe(true);
    });
  });

  describe('verifyOtp', () => {
    it('throws ValidationError for invalid OTP', async () => {
      prismaMock.otpCode.findFirst.mockResolvedValue(null);
      await expect(authService.verifyOtp('u@e.com', '000000', 'REGISTER'))
        .rejects.toMatchObject({ code: 'INVALID_OTP', statusCode: 400 });
    });

    it('returns token for valid OTP', async () => {
      prismaMock.otpCode.findFirst.mockResolvedValue({
        id: 'otp1',
        email: 'u@e.com',
        code: '123456',
        type: 'LOGIN',
        isUsed: false,
        expiresAt: new Date(Date.now() + 60000),
      } as never);
      prismaMock.otpCode.update.mockResolvedValue({} as never);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'u@e.com',
        fullName: 'User',
      } as never);
      prismaMock.user.update.mockResolvedValue({} as never);

      const result = await authService.verifyOtp('u@e.com', '123456', 'LOGIN');
      expect(result.token).toBeDefined();
    });
  });
});
