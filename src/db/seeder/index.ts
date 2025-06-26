import { PrismaClient } from '@prisma/client'
import { seedUser } from './dataseed/SeedUser'
import { seedRole } from './dataseed/SeedRole'
import parsingArgs from '../../utilities/ParseArgs'
import fs from 'fs'
import path from 'path'
const prisma = new PrismaClient()

const seedData = [
  // key is the name of the seeder, value is the function to run
  { key: 'role', value: seedRole },
  { key: 'user', value: seedUser },

  // Add more seeders here as needed
]

async function seedAll() {
  for (const { key, value } of seedData) {
    console.log(`Seeding ${key}...`)
    await value()
  }
  console.log('✅ Semua seeder selesai dijalankan.')
}

async function seedSpecific(key: string) {
  const seed = seedData.find((s) => s.key === key)
  if (seed) {
    console.log(`Seeding ${key}...`)
    await seed.value()
  } else {
    console.error(`❌ No seeder found for key: ${key}`)
    process.exit(1)
  }
}

async function seedFromReverse() {
  const seedersDir = path.join(process.cwd(), 'src/db/seeder/reverse')
  const files = fs.readdirSync(seedersDir).filter((file) => file.endsWith('.ts') || file.endsWith('.js'))

  console.log(`📂 Found ${files.length} reverse seeders in: ${seedersDir}`)
  console.log(`🚀 Running ${files.length} reverse seeders...\n`)

  for (const file of files) {
    const filePath = path.join(seedersDir, file)
    console.log(`🔍 Checking file: ${file} for seeder function...`)

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const seederModule = require(filePath) // ✅ PAKAI require() untuk TS dengan ts-node
      const seederFunctionName = Object.keys(seederModule).find((fn) => fn.startsWith('seed'))
      if (seederFunctionName && typeof seederModule[seederFunctionName] === 'function') {
        console.log(`🔄 Seeding from: ${file} -> ${seederFunctionName}()`)
        await seederModule[seederFunctionName]()
      } else {
        console.warn(`⚠️  No valid seed function found in: ${file}`)
      }
    } catch (err: any) {
      console.error(`❌ Failed to load seeder from ${file}: ${err.message}`)
    }
  }

  console.log('\n✅ All reverse seeders executed.')
}

async function main() {
  // Parsing arguments from command line
  // Example: node src/db/seeder/index.js ::seed=user
  const argsObj = parsingArgs(['::seed', '::seed_from_reverse'])
  if (argsObj.seed_from_reverse) {
    console.log('Running reverse seeders...')
    await seedFromReverse()
    return
  }

  if (argsObj.seed) {
    await seedSpecific(argsObj.seed as string)
  } else {
    await seedAll()
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    return prisma.$disconnect()
  })
