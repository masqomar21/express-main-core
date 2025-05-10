import { PrismaClient } from '@prisma/client'
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

const prisma: PrismaClient = global.prisma ?? new PrismaClient({
  log: logOptions,
})


global.prisma = prisma

prisma.$connect().then(() => {
  console.log('Connected to the database')
}).catch((error) => {
  console.error('Error connecting to the database:', error)
})


prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()

  if (params.model) {
    console.log(`Query ${params.action} on model ${params.model} took ${after - before}ms`)
  } else {
    console.log(`Query ${params.action} took ${after - before}ms`)
  }

  return result
})



export default prisma
