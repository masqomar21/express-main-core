import { PrismaClient, User } from '@prisma/client'
import { hashPassword } from '../../../utilities/PasswordHandler'

const prisma = new PrismaClient()

export async function seedUser() {
  console.log('Seed data inserted user')

  const passwordHash = await hashPassword('password')


  const role = await prisma.role.findMany()
  
  const usersData : Array<Omit<User, 'id'|'createdAt' | 'updatedAt' | 'deletedAt'>> = []
  
  role.forEach((role) => {
    usersData.push({
      password: passwordHash,
      name: role.name,
      email: `${role.name.toLowerCase().replace(/ /g, '_')}@app.com`,
      roleId: role.id,
    })
  })

  await prisma.user.createMany({
    data : usersData,
    skipDuplicates : true,
  })
}
