import { Router } from 'express';
import multer from 'multer';
import { protect, requireAdminRole } from '../../middleware/auth.middleware';
import * as datasetController from '../../controllers/dataset.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(protect);
router.use(requireAdminRole('DataManager'));

router.get('/datasets', datasetController.adminListAll);
router.post('/datasets', datasetController.adminCreate);
router.put('/datasets/:id', datasetController.adminUpdate);
router.delete('/datasets/:id', datasetController.adminDelete);
router.post('/datasets/:id/data-points', datasetController.adminAppendData);
router.post('/datasets/:id/import-xlsx', upload.single('file'), datasetController.adminImportXLSX);
router.post('/datasets/:id/cover-image', upload.single('image'), datasetController.adminUploadCoverImage);

// Unit conversions
router.get('/uom', async (req, res, next) => {
  try {
    const { prisma } = await import('../../utils/prisma');
    const conversions = await prisma.unitConversion.findMany({ orderBy: { fromUnit: 'asc' } });
    res.json({ success: true, data: conversions });
  } catch (err) { next(err); }
});

router.post('/uom', async (req, res, next) => {
  try {
    const { z } = await import('zod');
    const { prisma } = await import('../../utils/prisma');
    const schema = z.object({ fromUnit: z.string(), toUnit: z.string(), factor: z.number(), label: z.string().optional() });
    const data = schema.parse(req.body);
    const result = await prisma.unitConversion.upsert({
      where: { fromUnit_toUnit: { fromUnit: data.fromUnit, toUnit: data.toUnit } },
      update: data,
      create: data,
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
