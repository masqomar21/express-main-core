import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../../../utilities/PasswordHandler'
// import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export async function seedUser() {
  console.log('Seed data inserted user')

  const data = [
    {
      name: 'Test User',
      email: 'user.test@app.com',
      password: await hashPassword('password'),
      roleId: (await prisma.role
        .findFirst({
          where: {
            name: 'user',
          },
        })
        .then((data) => data?.id)) as number,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      name: 'Test Admin',
      email: 'admin.test@app.com',
      password: await hashPassword('password'),
      roleId: (await prisma.role
        .findFirst({
          where: {
            name: 'admin',
          },
        })
        .then((data) => data?.id)) as number,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ]

  await prisma.user.createMany({
    data,
  })
}
