import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock the prisma module
jest.mock('../utils/prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

const { prisma } = require('../utils/prisma');
export const prismaMock = prisma as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
