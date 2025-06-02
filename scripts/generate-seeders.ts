import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()


function toPascalCase(str: string): string {
  return str.replace(/(^\w|_\w)/g, (match) => match.replace('_', '').toUpperCase())
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase()).replace(/^./, (c) => c.toLowerCase())
}

async function main() {
  const seedersDir = path.join(process.cwd(), 'src/db/seeder/reverse')
  if (!fs.existsSync(seedersDir)) {
    fs.mkdirSync(seedersDir)
  }

  const models = Object.keys(prisma).filter((key) => {
    const model = (prisma as any)[key]
    return typeof model?.findMany === 'function'
  })

  console.log(`📦 Found models: ${models.join(', ')}`)

  for (const model of models) {
    try {
      const data = await (prisma as any)[model].findMany()

      if (!data.length) {
        console.log(`⏭️  Skip ${model}, no data found.`)
        continue
      }

      const pascalCaseName = toPascalCase(model)
      const camelCaseName = toCamelCase(`seed_${model}`)

      const safeData = JSON.stringify(
        data,
        (_, value) =>
          typeof value === 'bigint'
            ? value.toString()
            : value instanceof Date
              ? value.toISOString()
              : value,
        2,
      )

      const seederContent = `import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function ${camelCaseName}() {
  await prisma.${model}.createMany({
    data: ${safeData},
    skipDuplicates: true,
  });
}
      `.trim()

      fs.writeFileSync(
        path.join(seedersDir, `${pascalCaseName}Seed.ts`),
        seederContent,
      )

      console.log(`✅ Seeder generated for model: ${model}`)
    } catch (err: any) {
      console.warn(`⚠️ Gagal generate seeder untuk ${model}: ${err.message}`)
    }
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
