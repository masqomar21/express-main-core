import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function seedRole() {
  await prisma.role.createMany({
    data: [
      {
        'id': 1,
        'name': 'User',
        'roleType': 'USER',
      },
      {
        'id': 2,
        'name': 'Admin',
        'roleType': 'ADMIN',
      },
      {
        'id': 3,
        'name': 'Super Admin',
        'roleType': 'SUPER_ADMIN',
      },
    ],
    skipDuplicates: true,
  })
}