import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { z } from 'zod';
import xss from 'xss';

export const getStaticPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = await prisma.staticPage.findUnique({ where: { slug: req.params.slug } });
    if (!page) throw new NotFoundError('Page not found');
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
};

export const getSitemap = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [datasets, freeResources] = await Promise.all([
      prisma.timeSeries.findMany({
        where: { isVisible: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.freeResource.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const baseUrl = process.env.FRONTEND_URL || 'https://waderaassociates.com';
    const staticPages = ['', 'about', 'contact', 'datasets', 'free-data', 'pages/privacy-policy', 'pages/terms-of-service'];

    const urls = [
      ...staticPages.map(p => `
  <url>
    <loc>${baseUrl}/${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`),
      ...datasets.map(d => `
  <url>
    <loc>${baseUrl}/datasets/${d.slug}</loc>
    <lastmod>${d.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`),
      ...freeResources.map(r => `
  <url>
    <loc>${baseUrl}/free-data/${r.slug}</loc>
    <lastmod>${r.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`),
    ];

    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`);
  } catch (err) { next(err); }
};

export const adminUpdatePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      metaTitle: z.string().optional(),
      metaDesc: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const content = data.content ? xss(data.content, {
      whiteList: {
        h1: [], h2: [], h3: [], h4: [], p: [], strong: [], em: [], ul: [], ol: [], li: [],
        a: ['href', 'title'], img: ['src', 'alt'], br: [], table: [], thead: [], tbody: [],
        tr: [], th: [], td: [], blockquote: [], code: [], pre: [],
      },
    }) : undefined;

    await prisma.staticPage.update({
      where: { slug: req.params.slug },
      data: { ...data, ...(content && { content }), updatedBy: req.user!.id },
    });

    res.json({ success: true, data: { message: 'Page updated' } });
  } catch (err) { next(err); }
};

export const adminListPages = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pages = await prisma.staticPage.findMany({ orderBy: { slug: 'asc' } });
    res.json({ success: true, data: pages });
  } catch (err) { next(err); }
};

export const adminGetEmailTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { type: req.params.type } });
    if (!template) throw new NotFoundError('Template not found');
    res.json({ success: true, data: template });
  } catch (err) { next(err); }
};

export const adminListEmailTemplates = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const templates = await prisma.emailTemplate.findMany({ orderBy: { type: 'asc' } });
    res.json({ success: true, data: templates });
  } catch (err) { next(err); }
};

export const adminUpdateEmailTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      subject: z.string().min(1).optional(),
      htmlBody: z.string().min(1).optional(),
      isActive: z.boolean().optional(),
    });
    const data = schema.parse(req.body);

    await prisma.emailTemplate.update({
      where: { type: req.params.type },
      data: { ...data, updatedBy: req.user!.id },
    });

    res.json({ success: true, data: { message: 'Template updated' } });
  } catch (err) { next(err); }
};

export const adminPreviewEmailTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Handlebars = (await import('handlebars')).default;
    const schema = z.object({ htmlBody: z.string(), variables: z.record(z.string()) });
    const { htmlBody, variables } = schema.parse(req.body);
    const compiled = Handlebars.compile(htmlBody);
    const preview = compiled({ ...variables, year: new Date().getFullYear(), frontendUrl: process.env.FRONTEND_URL });
    res.json({ success: true, data: { preview } });
  } catch (err) { next(err); }
};

export const adminListContactMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};
    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.contactMessage.count({ where }),
    ]);

    res.json({ success: true, data: { messages, total, page, limit } });
  } catch (err) { next(err); }
};

export const adminUpdateContactStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED']),
      adminNotes: z.string().optional(),
    });
    const data = schema.parse(req.body);
    await prisma.contactMessage.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: { message: 'Status updated' } });
  } catch (err) { next(err); }
};
