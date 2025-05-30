import { PrismaClient, Role, RoleType } from '@prisma/client'
// import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export async function seedRole() {
  console.log('Seed data inserted role')

  const roleTypes = RoleType as typeof RoleType & {
    [key: string]: RoleType
  }

  function formatRoleName(role) {
    return role
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  for(const item of Object.values(roleTypes)) {
    const role: Omit<Role, 'id'> = {
      name: formatRoleName(item),
      roleType: item,
    }

    // Check if the role already exists
    const existingRole = await prisma.role.findFirst({
      where: { name: role.name },
    })

    if (!existingRole) {
      // Create the role if it does not exist
      await prisma.role.create({ data: role })
      console.log(`Role ${item} created`)
    } else {
      console.log(`Role ${item} already exists`)
    }
    
  }
  
}
