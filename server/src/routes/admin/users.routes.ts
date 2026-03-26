import { Router } from 'express';
import { protect, requireAdminRole } from '../../middleware/auth.middleware';
import { adminAssignLicense, adminRevokeLicense, adminGetLicenseTypes } from '../../controllers/license.controller';

const router = Router();
router.use(protect);
router.use(requireAdminRole('UserManager'));

// User management
router.get('/users', async (req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;
    const where = search ? {
      OR: [
        { email: { contains: search } },
        { fullName: { contains: search } },
      ],
      deletedAt: null,
    } : { deletedAt: null };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, fullName: true, phone: true, isEmailVerified: true, createdAt: true, role: { select: { name: true } } },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ success: true, data: { users, total, page, limit } });
  } catch (err) { next(err); }
});

router.patch('/users/:id/suspend', async (req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json({ success: true, data: { message: 'User suspended' } });
  } catch (err) { next(err); }
});

router.patch('/users/:id/restore', async (req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: null } });
    res.json({ success: true, data: { message: 'User restored' } });
  } catch (err) { next(err); }
});

// Licenses
router.get('/license-types', adminGetLicenseTypes);
router.post('/licenses', adminAssignLicense);
router.delete('/licenses/:id', adminRevokeLicense);

router.get('/users/:id/licenses', async (req, res, next) => {
  try {
    const { getUserLicenses } = await import('../../services/license.service');
    const licenses = await getUserLicenses(req.params.id);
    res.json({ success: true, data: licenses });
  } catch (err) { next(err); }
});

// Download logs
router.get('/download-logs', async (req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.downloadLog.findMany({
        skip, take: limit,
        orderBy: { downloadedAt: 'desc' },
        include: {
          user: { select: { email: true, fullName: true } },
          timeSeries: { select: { name: true, slug: true } },
        },
      }),
      prisma.downloadLog.count(),
    ]);
    res.json({ success: true, data: { logs, total, page, limit } });
  } catch (err) { next(err); }
});

// IP banning
router.get('/banned-ips', async (_req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    const banned = await prisma.bannedIP.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: banned });
  } catch (err) { next(err); }
});

router.post('/banned-ips', async (req, res, next) => {
  try {
    const { z } = await import('zod');
    const { prisma } = await import('../../utils/prisma');
    const { ipAddress, reason } = z.object({ ipAddress: z.string().ip(), reason: z.string().optional() }).parse(req.body);
    await prisma.bannedIP.create({ data: { ipAddress, reason, bannedBy: req.user!.id } });
    res.status(201).json({ success: true, data: { message: 'IP banned' } });
  } catch (err) { next(err); }
});

router.delete('/banned-ips/:id', async (req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    await prisma.bannedIP.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'IP unbanned' } });
  } catch (err) { next(err); }
});

export default router;
