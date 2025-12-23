import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null;
};

function createPrismaClient(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.warn('DATABASE_URL not set');
    return null;
  }

  try {
    // Prisma 7 с Accelerate
    return new PrismaClient({
      accelerateUrl: dbUrl,
    });
  } catch (error) {
    console.error('Prisma init error:', error);
    return null;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
