import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface DownloadTokenPayload {
  purchaseId: string;
  timeSeriesId: string;
  guestEmail?: string;
  type: 'DOWNLOAD';
}

export function signToken(payload: JwtPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function signDownloadToken(payload: Omit<DownloadTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'DOWNLOAD' }, env.JWT_SECRET, { expiresIn: '24h' });
}

export function verifyDownloadToken(token: string): DownloadTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as DownloadTokenPayload;
  if (decoded.type !== 'DOWNLOAD') throw new Error('Invalid token type');
  return decoded;
}
