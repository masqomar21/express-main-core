import { PrismaClient } from '@prisma/client'
import { seedUser } from './dataseed/UserSeeder'
import { seedRole } from './dataseed/RoleSeeder'
import parsingArgs from '../../utilities/ParseArgs'


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

async function main() {
  // Parsing arguments from command line
  // Example: node src/db/seeder/index.js ::seed=user
  const argsObj = parsingArgs(['::seed'])

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
