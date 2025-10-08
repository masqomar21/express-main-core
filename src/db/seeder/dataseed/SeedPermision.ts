import { Permissions, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedPermissions() {
  console.log('Seed data inserted permissions')

  const listPermission = [
    'Dashboard',
    'Manajemen User:User',
    'Manajemen User:Role',
    'Master:Kategori',
    // add more permissions as needed
  ]

  const permissionList: Array<Omit<Permissions, 'id'>> = listPermission.map((permission) => ({
    name: permission.split(':').length > 1 ? permission.split(':')[1].trim() : permission,
    label: permission.replace(/_/g, ' '),
  }))

  await prisma.permissions.createMany({
    data: permissionList,
    skipDuplicates: true,
  })
}
