import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as svc from '../services/freeResource.service';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(500).optional(),
  type: z.enum(['ARTICLE', 'PDF']),
  content: z.string().optional(),
  pdfUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().max(100).optional(),
  coverImage: z.string().optional(),
  isPublished: z.boolean().optional(),
});

// ── Public ────────────────────────────────────────────────

export const listPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, category, page, limit } = req.query;
    const data = await svc.listPublishedResources({
      type: type as string | undefined,
      category: category as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resource = await svc.getPublishedBySlug(req.params.slug);
    res.json({ success: true, data: resource });
  } catch (err) { next(err); }
};

export const getPublicCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await svc.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

// ── Admin ─────────────────────────────────────────────────

export const adminList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const data = await svc.listAllResources({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const adminCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = createSchema.parse(req.body);
    const resource = await svc.createResource({ ...input, createdById: req.user!.id });
    res.status(201).json({ success: true, data: resource });
  } catch (err) { next(err); }
};

export const adminUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = createSchema.partial().parse(req.body);
    const resource = await svc.updateResource(req.params.id, input);
    res.json({ success: true, data: resource });
  } catch (err) { next(err); }
};

export const adminDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.deleteResource(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};
