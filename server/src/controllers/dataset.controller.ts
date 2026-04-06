import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import * as datasetService from '../services/dataset.service';
import { getAllRates } from '../utils/currency';
import { getAvailableConversions } from '../utils/uom';
import { env } from '../config/env';
import { uploadToS3 } from '../utils/storage';

const createDatasetSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  defaultUnit: z.string().min(1),
  priceINR: z.number().positive(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  region: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      page: z.coerce.number().positive().default(1),
      limit: z.coerce.number().positive().max(100).default(20),
      category: z.string().optional(),
      search: z.string().optional(),
      sortBy: z.enum(['name', 'createdAt', 'priceINR']).default('createdAt'),
      order: z.enum(['asc', 'desc']).default('desc'),
    });
    const params = schema.parse(req.query);
    const result = await datasetService.getPublicDatasets(params);
    const rates = await getAllRates();
    res.json({ success: true, data: { ...result, exchangeRates: rates } });
  } catch (err) { next(err); }
};

export const getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const includeData = req.query.includeData === 'true';
    const dataset = await datasetService.getDatasetBySlug(req.params.slug, includeData);
    const rates = await getAllRates();
    const conversions = await getAvailableConversions(dataset.defaultUnit);
    res.json({ success: true, data: { dataset, exchangeRates: rates, availableConversions: conversions } });
  } catch (err) { next(err); }
};

export const getFeatured = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const datasets = await datasetService.getFeaturedDatasets();
    res.json({ success: true, data: datasets });
  } catch (err) { next(err); }
};

export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await datasetService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

// Admin controllers
export const adminCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createDatasetSchema.parse(req.body);
    const dataset = await datasetService.createDataset({ ...data, createdById: req.user!.id });
    res.status(201).json({ success: true, data: dataset });
  } catch (err) { next(err); }
};

export const adminUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createDatasetSchema.partial().parse(req.body);
    await datasetService.updateDataset(req.params.id, data);
    res.json({ success: true, data: { message: 'Dataset updated' } });
  } catch (err) { next(err); }
};

export const adminDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await datasetService.deleteDataset(req.params.id);
    res.json({ success: true, data: { message: 'Dataset hidden' } });
  } catch (err) { next(err); }
};

export const adminAppendData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      points: z.array(z.object({
        date: z.string().regex(/^\d{4}-\d{2}$/, 'Date must be YYYY-MM format'),
        value: z.number(),        // LocalCurrency/Unit
        usdValue: z.number().optional(), // USD/Unit
        note: z.string().optional(),
      })).min(1),
    });
    const { points } = schema.parse(req.body);
    await datasetService.appendDataPoints(req.params.id, points);
    res.json({ success: true, data: { message: `${points.length} data points saved` } });
  } catch (err) { next(err); }
};

export const adminImportXLSX = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
      return;
    }
    const result = await datasetService.importFromXLSX(req.params.id, req.file.buffer);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const adminUploadCoverImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No image uploaded' } });
      return;
    }

    const { id } = req.params;
    const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
    let imageUrl: string;

    if (env.AWS_BUCKET_NAME) {
      const key = `datasets/covers/${id}.${ext}`;
      await uploadToS3(key, req.file.buffer, req.file.mimetype);
      imageUrl = `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    } else {
      // Local dev: save to public/uploads/datasets/
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'datasets');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `${id}.${ext}`;
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
      imageUrl = `/uploads/datasets/${filename}`;
    }

    await datasetService.updateCoverImage(id, imageUrl);
    res.json({ success: true, data: { coverImage: imageUrl } });
  } catch (err) { next(err); }
};

export const adminListAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [datasets, total] = await Promise.all([
      (await import('../utils/prisma')).prisma.timeSeries.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { dataPoints: true, purchases: true } } },
      }),
      (await import('../utils/prisma')).prisma.timeSeries.count(),
    ]);

    res.json({ success: true, data: { datasets, total, page, limit } });
  } catch (err) { next(err); }
};
