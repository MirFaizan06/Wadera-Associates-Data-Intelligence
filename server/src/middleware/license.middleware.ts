import { Request, Response, NextFunction } from 'express';
import { checkUserLicense, LicensePermission } from '../services/license.service';
import { LicenseError, AuthError } from '../utils/errors';
import { verifyDownloadToken } from '../utils/token';

export const requireLicense = (permission: LicensePermission) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        // Check for download token (guest access)
        const dlToken = req.query.token as string | undefined;
        if (dlToken && permission === 'DOWNLOAD') {
          try {
            const decoded = verifyDownloadToken(dlToken);
            const timeSeriesId = req.params.id || req.params.timeSeriesId;
            if (decoded.timeSeriesId === timeSeriesId) {
              return next();
            }
          } catch {
            throw new AuthError('Invalid download token');
          }
        }
        throw new AuthError('Authentication required');
      }

      const timeSeriesId = req.params.id || req.params.timeSeriesId;
      const hasLicense = await checkUserLicense(req.user.id, timeSeriesId, permission);

      if (!hasLicense) {
        throw new LicenseError(`License required for ${permission.toLowerCase()} access`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
