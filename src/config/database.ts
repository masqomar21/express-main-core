import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaClientOptions } from '@prisma/client/runtime/library'

interface CostumeNodeGlobal extends Global {
  prisma?: PrismaClient;
}

declare const global: CostumeNodeGlobal

const logOptions : PrismaClientOptions['log'] = [
  {
    emit: 'event',
    level: 'query',
  },
  {
    emit: 'event',
    level: 'info',
  },
  {
    emit: 'event',
    level: 'warn',
  },
  {
    emit: 'event',
    level: 'error',
  },
]

/**
 * Logger extension — logs every query with execution time
 */
const loggerExtension = Prisma.defineExtension({
  name: 'query-logger',
  query: {
    $allModels: {
      $allOperations: async ({ model, operation, args, query }) => {
        const start = performance.now()
        const result = await query(args)
        const elapsed = (performance.now() - start).toFixed(1)

        // You can swap console.log with pino/winston here
        console.log(
          `[Prisma] ${model}.${operation} (${elapsed}ms)`,
          // JSON.stringify(args),
        )

        return result
      },
    },
  },
})


const prisma: PrismaClient =
  (global.prisma as PrismaClient | undefined) ??
  (new PrismaClient({ log: logOptions }).$extends(loggerExtension) as unknown as PrismaClient)

global.prisma = prisma

prisma.$connect().then(() => {
  console.log('Connected to the database')
}).catch((error) => {
  console.error('Error connecting to the database:', error)
})



export default prisma
