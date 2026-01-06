import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

async function createPrismaClient(): Promise<PrismaClient> {
  const dbUrl = process.env.DATABASE_URL || '';

  // Если URL начинается с prisma:// - используем Accelerate
  if (dbUrl.startsWith('prisma://')) {
    return new PrismaClient({
      datasourceUrl: dbUrl,
    });
  }

  // Если обычный PostgreSQL URL - используем прямое подключение через pg adapter
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    try {
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: dbUrl });
      const adapter = new PrismaPg(pool);
      return new PrismaClient({ adapter });
    } catch {
      // Если adapter недоступен, используем стандартное подключение
      return new PrismaClient();
    }
  }

  // Fallback - стандартный клиент
  return new PrismaClient();
}

// Синхронная инициализация для совместимости
let prismaInstance: PrismaClient | null = null;

function getPrismaSync(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const dbUrl = process.env.DATABASE_URL || '';

  // Для Accelerate - простая инициализация
  if (dbUrl.startsWith('prisma://')) {
    prismaInstance = new PrismaClient({
      datasourceUrl: dbUrl,
    });
  } else {
    // Для PostgreSQL - стандартный клиент (adapter будет загружен автоматически если настроен в schema)
    prismaInstance = new PrismaClient();
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }

  return prismaInstance;
}

export const prisma = getPrismaSync();
export { createPrismaClient };
export default prisma;
