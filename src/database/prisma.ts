import { PrismaClient } from '@prisma/client';

import { logger } from '../utils/logger.js';

declare global {
  var prismaClient: PrismaClient | undefined;
}

export const prisma = globalThis.prismaClient ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaClient = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    logger.error({ error }, 'Gagal menutup koneksi database');
    throw error;
  }
}
