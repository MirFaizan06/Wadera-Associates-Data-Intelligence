import { Router } from 'express';
import { protect, requireAdminRole } from '../../middleware/auth.middleware';
import fs from 'fs';
import path from 'path';

const router = Router();
router.use(protect);
router.use(requireAdminRole('Developer'));

// System health
router.get('/health', async (_req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    const [userCount, datasetCount, purchaseCount] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.timeSeries.count(),
      prisma.purchase.count({ where: { status: 'SUCCESS' } }),
    ]);

    const memUsage = process.memoryUsage();
    res.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
          heap: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        },
        stats: { userCount, datasetCount, purchaseCount },
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
});

// Recent logs (last 100 lines of latest log file)
router.get('/logs', async (_req, res, next) => {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      res.json({ success: true, data: { logs: [] } });
      return;
    }
    const files = fs.readdirSync(logDir)
      .filter(f => f.startsWith('application-'))
      .sort()
      .reverse();

    if (files.length === 0) {
      res.json({ success: true, data: { logs: [] } });
      return;
    }

    const latestFile = path.join(logDir, files[0]);
    const content = fs.readFileSync(latestFile, 'utf-8');
    const lines = content.trim().split('\n').slice(-100).reverse();
    const logs = lines.map(line => { try { return JSON.parse(line); } catch { return { raw: line }; } });

    res.json({ success: true, data: { logs, file: files[0] } });
  } catch (err) { next(err); }
});

// Error logs
router.get('/error-logs', async (_req, res, next) => {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      res.json({ success: true, data: { logs: [] } });
      return;
    }
    const files = fs.readdirSync(logDir).filter(f => f.startsWith('error-')).sort().reverse();
    if (files.length === 0) {
      res.json({ success: true, data: { logs: [] } });
      return;
    }

    const latestFile = path.join(logDir, files[0]);
    const content = fs.readFileSync(latestFile, 'utf-8');
    const lines = content.trim().split('\n').slice(-50).reverse();
    const logs = lines.map(line => { try { return JSON.parse(line); } catch { return { raw: line }; } });
    res.json({ success: true, data: { logs } });
  } catch (err) { next(err); }
});

// Role management
router.get('/roles', async (_req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    const roles = await prisma.role.findMany({ include: { _count: { select: { users: true } } } });
    res.json({ success: true, data: roles });
  } catch (err) { next(err); }
});

router.put('/roles/:id', async (req, res, next) => {
  try {
    const { z } = await import('zod');
    const { prisma } = await import('../../utils/prisma');
    const schema = z.object({ permissions: z.array(z.string()) });
    const { permissions } = schema.parse(req.body);
    await prisma.role.update({ where: { id: req.params.id }, data: { permissions } });
    res.json({ success: true, data: { message: 'Permissions updated' } });
  } catch (err) { next(err); }
});

// Assign admin role to user
router.post('/users/:userId/assign-role', async (req, res, next) => {
  try {
    const { z } = await import('zod');
    const { prisma } = await import('../../utils/prisma');
    const { roleId } = z.object({ roleId: z.string().cuid().nullable() }).parse(req.body);
    await prisma.user.update({ where: { id: req.params.userId }, data: { roleId } });
    res.json({ success: true, data: { message: 'Role assigned' } });
  } catch (err) { next(err); }
});

// Email logs
router.get('/email-logs', async (req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({ skip, take: limit, orderBy: { sentAt: 'desc' } }),
      prisma.emailLog.count(),
    ]);
    res.json({ success: true, data: { logs, total, page, limit } });
  } catch (err) { next(err); }
});

// Exchange rates management
router.get('/exchange-rates', async (_req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    const rates = await prisma.exchangeRate.findMany({ orderBy: { toCurrency: 'asc' } });
    res.json({ success: true, data: rates });
  } catch (err) { next(err); }
});

router.post('/exchange-rates/refresh', async (_req, res, next) => {
  try {
    const { updateExchangeRates } = await import('../../jobs/exchangeRates.job');
    await updateExchangeRates();
    res.json({ success: true, data: { message: 'Exchange rates updated' } });
  } catch (err) { next(err); }
});

export default router;
