import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { ForbiddenError } from '../utils/errors';

export const ipBanCheck = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress || '';
    const normalizedIp = ip.replace('::ffff:', '');

    const banned = await prisma.bannedIP.findUnique({
      where: { ipAddress: normalizedIp },
    });

    if (banned) {
      next(new ForbiddenError('Your IP address has been banned', 'IP_BANNED'));
      return;
    }

    next();
  } catch {
    next(); // Don't block on DB error
  }
};
