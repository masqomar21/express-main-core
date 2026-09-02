import db from '@/config/database'
import fs from 'fs'
import path from 'path'

function toPascalCase(str: string): string {
  return str.replace(/(^\w|_\w)/g, (match) => match.replace('_', '').toUpperCase())
}

function toCamelCase(str: string): string {
  return str
    .replace(/_([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^./, (c) => c.toLowerCase())
}

async function main() {
  const seedersDir = path.join(process.cwd(), 'src/db/seeder/reverse')
  if (!fs.existsSync(seedersDir)) {
    fs.mkdirSync(seedersDir)
  }

  const models = Object.keys(db.orm.public)

  console.log(`📦 Found models: ${models.join(', ')}`)

  for (const model of models) {
    try {
      const modelDelegate = (db.orm.public as any)[model]
      if (typeof modelDelegate?.all !== 'function') continue

      const data = await modelDelegate.all()

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

      const seederContent = `import db from '@/config/database';

export async function ${camelCaseName}() {
  const items = ${safeData};
  for (const item of items) {
    await db.orm.public.${model}.create(item).catch(() => null);
  }
}
      `.trim()

      fs.writeFileSync(path.join(seedersDir, `${pascalCaseName}Seed.ts`), seederContent)

      console.log(`✅ Seeder generated for model: ${model}`)
    } catch (err: any) {
      console.warn(`⚠️ Gagal generate seeder untuk ${model}: ${err.message}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
