import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../../../utilities/PasswordHandler'
// import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export async function seedUser() {
  console.log('Seed data inserted user')

  const passwordHash = await hashPassword('password123')

  const getAllRole = await prisma.role.findMany()

  const fixedUsers = [
    { name: 'Super Admin', RoleType: 'SUPER_ADMIN' },
    { name: 'Admin', RoleType: 'ADMIN' },
    { name: 'User', RoleType: 'USER' },
  ]

  for (const user of fixedUsers) {
    const existingUser = await prisma.user.findFirst({
      where: { name: user.name },
    })

    if (!existingUser) {
      const role = getAllRole.find((role) => role.roleType === user.RoleType)

      if (role) {
        await prisma.user.create({
          data: {
            name: user.name,
            email: `${user.name.toLowerCase().replace(' ', '_')}@app.com`,
            password: passwordHash,
            roleId: role.id,
          },
        })
        console.log(`User ${user.name} created successfully`)
      } else {
        console.log(`Role ${user.RoleType} not found for user ${user.name}`)
      }
    } else {
      console.log(`User ${user.name} already exists, skipping creation`)
    }
  }
}
