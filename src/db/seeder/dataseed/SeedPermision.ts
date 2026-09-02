import db from '@/config/database'

export async function seedPermissions() {
  console.log('Seed data inserted permissions')

  const listPermission = [
    'Dashboard',
    'Manajemen User:User',
    'Manajemen User:Role',
    'Master:Kategori',
    // add more permissions as needed
  ]

  for (const permission of listPermission) {
    const name = permission.split(':').length > 1 ? permission.split(':')[1].trim() : permission
    const label = permission.replace(/_/g, ' ')

    const existing = await db.orm.public.Permissions.where({ name }).first()
    if (!existing) {
      await db.orm.public.Permissions.create({
        name,
        label,
      })
    }
  }
}
