import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AuthError, ForbiddenError } from '../utils/errors';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roleId: string | null;
        role?: { name: string; permissions: string[] } | null;
      };
    }
  }
}

export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check cookie first, then Authorization header
    if (req.cookies?.token) {
      token = req.cookies.token as string;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AuthError('No authentication token provided', 'NO_TOKEN');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new AuthError('User not found or deleted', 'USER_NOT_FOUND');
    }

    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.role ? {
        name: user.role.name,
        permissions: user.role.permissions as string[],
      } : null,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AuthError('Invalid token', 'INVALID_TOKEN'));
    } else if (err instanceof jwt.TokenExpiredError) {
      next(new AuthError('Token expired', 'TOKEN_EXPIRED'));
    } else {
      next(err);
    }
  }
};

export const authorize = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthError('Not authenticated', 'NOT_AUTHENTICATED'));
    }

    const userPermissions = req.user.role?.permissions || [];
    const hasPermission = permissions.every(p => userPermissions.includes(p));

    if (!hasPermission) {
      logger.warn('Permission denied', {
        userId: req.user.id,
        required: permissions,
        has: userPermissions,
      });
      return next(new ForbiddenError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};

export const requireAdminRole = (roleName: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user?.role) {
      return next(new ForbiddenError('Admin role required', 'ADMIN_REQUIRED'));
    }

    // Developer can access everything
    if (req.user.role.name === 'Developer') {
      return next();
    }

    if (req.user.role.name !== roleName) {
      return next(new ForbiddenError(`${roleName} role required`, 'WRONG_ROLE'));
    }

    next();
  };
};
