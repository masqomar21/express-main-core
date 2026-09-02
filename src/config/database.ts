import postgres from '@prisma/orm-postgres/runtime'
import type { Contract } from '../../generated/prisma8/contract.js'
import contractJson from '../../generated/prisma8/contract.json'
import { CONFIG } from '.'

export * from '../../generated/prisma8/contract.js'

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof postgres<Contract>> | undefined
}

if (!globalForDb.db) {
  globalForDb.db = postgres<Contract>({
    url: CONFIG.database.connectionString,
    contractJson: contractJson as any,
  })
}

export const db = globalForDb.db
export const prisma = db
export default db
