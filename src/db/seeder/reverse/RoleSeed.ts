import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function seedRole() {
  await prisma.role.createMany({
    data: [
      {
        'id': 1,
        'name': 'admin',
        'roleType': 'ADMIN',
      },
      {
        'id': 2,
        'name': 'user',
        'roleType': 'USER',
      },
      {
        'id': 3,
        'name': 'superadmin',
        'roleType': 'SUPER_ADMIN',
      },
    ],
    skipDuplicates: true,
  })
}