import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedPermissions() {
  console.log('Seed data inserted permissions')

  const listPermission =[
    'Dashboard',
    'User_Management',
    'Master_Data',
    // add more permissions as needed
  ]

  await prisma.permissions.createMany({
    data: listPermission.map(permission => ({
      name: permission,
      label : permission.replace(/_/g, ' '),
    })),
    skipDuplicates: true,
  })
}
