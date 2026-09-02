import 'dotenv/config'
import { definePrismaConfig } from 'prisma/config'
import { defineConfig as definePostgresConfig } from '@prisma/orm-postgres/config'

const databaseUrl = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}?timezone=${process.env.DB_TIMEZONE}`

export default definePrismaConfig({
  orm: definePostgresConfig({
    contract: 'prisma8/contract.prisma',
    output: 'generated/prisma8',
    db: {
      connection: databaseUrl,
    },
  }),
})
