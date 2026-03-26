import { Router } from 'express';
import { protect, requireAdminRole } from '../../middleware/auth.middleware';

const router = Router();
router.use(protect);
router.use(requireAdminRole('FinancialManager'));

router.get('/orders', async (req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(dateFrom || dateTo ? { purchasedAt: { ...(dateFrom && { gte: dateFrom }), ...(dateTo && { lte: dateTo }) } } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.purchase.findMany({
        where, skip, take: limit,
        orderBy: { purchasedAt: 'desc' },
        include: {
          user: { select: { email: true, fullName: true } },
          timeSeries: { select: { name: true, slug: true } },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    // Revenue stats
    const stats = await prisma.purchase.aggregate({
      where: { status: 'SUCCESS', ...( (dateFrom || dateTo) ? { purchasedAt: { ...(dateFrom && { gte: dateFrom }), ...(dateTo && { lte: dateTo }) } } : {}) },
      _sum: { amountINR: true },
      _count: { _all: true },
    });

    res.json({ success: true, data: { orders, total, page, limit, revenue: stats._sum.amountINR || 0, successCount: stats._count._all } });
  } catch (err) { next(err); }
});

router.get('/revenue-chart', async (req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    // Last 12 months
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });

    const data = await Promise.all(months.map(async ({ year, month }) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      const agg = await prisma.purchase.aggregate({
        where: { status: 'SUCCESS', purchasedAt: { gte: start, lte: end } },
        _sum: { amountINR: true },
        _count: { _all: true },
      });
      return { label: `${year}-${String(month).padStart(2, '0')}`, revenue: agg._sum.amountINR || 0, orders: agg._count._all };
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
