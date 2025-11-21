import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "generated/prisma/client"
import { LogDefinition } from "generated/prisma/internal/prismaNamespace"
import { CONFIG } from "."

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

const adapter = new PrismaPg({connectionString : CONFIG.database.connectionString})

const prisma =new PrismaClient({log : logOptions, adapter: adapter}).$extends({
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


prisma
  .$connect()
  .then(() => {
    console.log('Connected to the database')
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error)
  })


export default prisma
