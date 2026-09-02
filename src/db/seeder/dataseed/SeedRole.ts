import db from '@/config/database'

export async function seedRole() {
  console.log('Seed data inserted role')

  const roleTypes: Record<string, 'OTHER' | 'SUPER_ADMIN'> = {
    OTHER: 'OTHER',
    SUPER_ADMIN: 'SUPER_ADMIN',
  }

  function formatRoleName(role: string): string {
    return role
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  for (const item of Object.values(roleTypes)) {
    const role = {
      name: formatRoleName(item),
      roleType: item,
    }

    // Check if the role already exists
    const existingRole = await db.orm.public.Role.where({ name: role.name }).first()

    if (!existingRole) {
      // Create the role if it does not exist
      await db.orm.public.Role.create(role)
      console.log(`Role ${item} created`)
    } else {
      console.log(`Role ${item} already exists`)
    }
  }
}
