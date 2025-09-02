import { PrismaClient, RolePermission } from '@prisma/client'

const prisma = new PrismaClient()


type PermissionList =
  | 'Dashboard'
  | 'User_Management'
  | 'Master_Data'
  // add more permissions as needed


export async function seedRolePermission() {
  console.log('Seed data inserted role permissions')

  const listRole = await prisma.role.findMany()

  const listPermission = await prisma.permissions.findMany()

  const listRolePermission : Array<{roleId : number, permission : PermissionList[]}> = []

  listRole.forEach((role) => {
    if (role.roleType === 'SUPER_ADMIN') {
      listRolePermission.push({
        roleId: role.id,
        permission:['Dashboard', 'User_Management', 'Master_Data'],
      })  
    } else {
      listRolePermission.push({
        roleId: role.id,
        permission: ['Dashboard', 'Master_Data'],
      })
    }
  })

  const rolePermissionsData : Array<Omit<RolePermission, 'id'>> = []

  listRolePermission.forEach((rolePerm) => {
    listPermission.forEach((permission) => {
      const hasPermission = rolePerm.permission.includes(permission.name as PermissionList)

      if (permission.id !== undefined) {
        rolePermissionsData.push({
          roleId: rolePerm.roleId,
          permissionId: permission.id,
          canRead: hasPermission,
          canWrite: hasPermission,
          canDelete: hasPermission,
          canRestore: hasPermission,
          canUpdate: hasPermission,
        })
      }
    })
  })

  // console.log('Role Permissions Data:', rolePermissionsData)

  await prisma.rolePermission.createMany({
    data: rolePermissionsData,
  })
}
