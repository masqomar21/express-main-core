import { PrismaClient } from '@prisma/client'
import { logger } from '../core/logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
  logger.info('🟢 Prisma Client initialized')
}