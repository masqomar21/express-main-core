import prisma from '@/config/database'
import { Permissions } from 'generated/prisma/client'

export async function seedPermissions() {
  console.log('Seed data inserted permissions')

  const listPermission = [
    'Dashboard',
    'Manajemen User:User',
    'Manajemen User:Role',
    'Master:Kategori',
    // add more permissions as needed
  ]

  const PermissionList: Array<Omit<Permissions, 'id'>> = listPermission.map((permission) => ({
    name: permission.split(':').length > 1 ? permission.split(':')[1].trim() : permission,
    label: permission.replace(/_/g, ' '),
  }))

  await prisma.permissions.createMany({
    data: PermissionList,
    skipDuplicates: true,
  })
}
