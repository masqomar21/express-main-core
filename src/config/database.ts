import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from 'generated/prisma/client'
import { LogDefinition } from 'generated/prisma/internal/prismaNamespace'
import { CONFIG } from '.'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const logOptions: LogDefinition[] = [
  {
    emit: 'event',
    level: 'query',
  },
  {
    emit: 'stdout',
    level: 'info',
  },
  {
    emit: 'stdout',
    level: 'warn',
  },
  {
    emit: 'stdout',
    level: 'error',
  },
]

if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg({
    connectionString: CONFIG.database.connectionString,
  })

  const baseClient = new PrismaClient({
    adapter,
    log: logOptions,
  })

  globalForPrisma.prisma = baseClient.$extends({
    name: 'query-logger',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = performance.now()
          const result = await query(args)
          const elapsed = (performance.now() - start).toFixed(1)

          console.log(`[Prisma] ${model}.${operation} (${elapsed}ms)`)

          return result
        },
      },
    },
  }) as PrismaClient
}

const prisma = globalForPrisma.prisma
export default prisma
