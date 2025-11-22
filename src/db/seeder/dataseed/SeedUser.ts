import prisma from '@/config/database'
import { hashPassword } from '../../../utilities/PasswordHandler'
import { User } from 'generated/prisma/client'

export async function seedUser() {
  console.log('Seed data inserted user')

  const passwordHash = await hashPassword('password')

  const role = await prisma.role.findMany()

  const usersData: Array<Omit<User, 'id' | 'createdAt' | 'deletedAt'>> = []

  role.forEach((role) => {
    usersData.push({
      password: passwordHash,
      name: role.name,
      email: `${role.name.toLowerCase().replace(/ /g, '_')}@app.com`,
      roleId: role.id,
      registeredViaGoogle: false,
      updatedAt: new Date(),
    })
  })

  await prisma.user.createMany({
    data: usersData,
    skipDuplicates: true,
  })
}
