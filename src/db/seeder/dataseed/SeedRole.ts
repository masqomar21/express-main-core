import { PrismaClient, Role } from '@prisma/client'
// import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export async function seedRole() {
  console.log('Seed data inserted role')

  const RoleData :Array< Omit<Role, 'id'>> = [
    {
      name: 'admin',
      roleType: 'ADMIN',
    },
    {
      name: 'user',
      roleType: 'USER',
    },
    {
      name: 'superadmin',
      roleType: 'SUPER_ADMIN',
    },
  ]

  for (const role of RoleData) {
    const existingRole = await prisma.role.findFirst({
      where: { name: role.name },
    })

    if (!existingRole) {
      await prisma.role.create({
        data: role,
      })
      console.log(`Role ${role.name} created successfully`)
    } else {
      console.log(`Role ${role.name} already exists, skipping creation`)
    }
  }
}
