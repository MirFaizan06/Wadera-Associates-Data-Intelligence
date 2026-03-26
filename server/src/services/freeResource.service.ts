import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { NotFoundError, ConflictError } from '../utils/errors';
import slugify from '../utils/slugify';

export interface CreateFreeResourceInput {
  title: string;
  summary?: string;
  type: 'ARTICLE' | 'PDF';
  content?: string;
  pdfUrl?: string;
  category?: string;
  tags?: string[];
  author?: string;
  coverImage?: string;
  isPublished?: boolean;
  createdById?: string;
}

export async function listPublishedResources(params: {
  type?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  const { type, category, page = 1, limit = 20 } = params;
  const where: Prisma.FreeResourceWhereInput = {
    isPublished: true,
    ...(type && { type }),
    ...(category && { category }),
  };

  const [items, total] = await Promise.all([
    prisma.freeResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, slug: true, title: true, summary: true,
        type: true, category: true, tags: true, author: true,
        coverImage: true, pdfUrl: true, createdAt: true,
      },
    }),
    prisma.freeResource.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPublishedBySlug(slug: string) {
  const resource = await prisma.freeResource.findUnique({
    where: { slug, isPublished: true },
  });
  if (!resource) throw new NotFoundError('Resource not found');
  return resource;
}

export async function listAllResources(params: { page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = params;
  const [items, total] = await Promise.all([
    prisma.freeResource.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.freeResource.count(),
  ]);
  return { items, total, page, limit };
}

export async function createResource(input: CreateFreeResourceInput) {
  const base = slugify(input.title);
  let slug = base;
  let i = 1;
  while (await prisma.freeResource.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }

  return prisma.freeResource.create({
    data: {
      slug,
      title: input.title,
      summary: input.summary,
      type: input.type,
      content: input.content,
      pdfUrl: input.pdfUrl,
      category: input.category,
      tags: input.tags ?? Prisma.JsonNull,
      author: input.author,
      coverImage: input.coverImage,
      isPublished: input.isPublished ?? false,
      createdById: input.createdById,
    },
  });
}

export async function updateResource(id: string, data: Partial<CreateFreeResourceInput>) {
  const existing = await prisma.freeResource.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Resource not found');

  let slug = existing.slug;
  if (data.title && data.title !== existing.title) {
    const base = slugify(data.title);
    slug = base;
    let i = 1;
    while (await prisma.freeResource.findFirst({ where: { slug, NOT: { id } } })) {
      slug = `${base}-${i++}`;
    }
  }

  return prisma.freeResource.update({
    where: { id },
    data: {
      slug,
      title: data.title,
      summary: data.summary,
      type: data.type,
      content: data.content,
      pdfUrl: data.pdfUrl,
      category: data.category,
      tags: data.tags !== undefined ? (data.tags ?? Prisma.JsonNull) : undefined,
      author: data.author,
      coverImage: data.coverImage,
      isPublished: data.isPublished,
    },
  });
}

export async function deleteResource(id: string) {
  const existing = await prisma.freeResource.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Resource not found');
  await prisma.freeResource.delete({ where: { id } });
}

export async function getCategories() {
  const result = await prisma.freeResource.findMany({
    where: { isPublished: true, category: { not: null } },
    select: { category: true },
    distinct: ['category'],
  });
  return result.map(r => r.category!).filter(Boolean);
}
