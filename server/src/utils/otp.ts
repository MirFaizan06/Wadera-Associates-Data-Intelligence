import { authenticator } from 'otplib';

authenticator.options = { step: 600 }; // 10 minutes

export function generateOtp(): string {
  // Generate 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}
