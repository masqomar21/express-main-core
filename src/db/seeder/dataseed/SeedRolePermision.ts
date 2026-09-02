import db from '@/config/database'

type PermissionList = 'Dashboard' | 'User_Management' | 'Master_Data'
// add more permissions as needed

export async function seedRolePermission() {
  console.log('Seed data inserted role permissions')

  const listRole = await db.orm.public.Role.all()
  const listPermission = await db.orm.public.Permissions.all()

  const listRolePermission: Array<{ roleId: number; permission: PermissionList[] }> = []

  listRole.forEach((role) => {
    if (role.roleType === 'SUPER_ADMIN') {
      listRolePermission.push({
        roleId: role.id,
        permission: ['Dashboard', 'User_Management', 'Master_Data'],
      })
    } else {
      listRolePermission.push({
        roleId: role.id,
        permission: ['Dashboard', 'Master_Data'],
      })
    }
  })

  for (const rolePerm of listRolePermission) {
    for (const permission of listPermission) {
      const hasPermission = rolePerm.permission.includes(permission.name as PermissionList)

      const existing = await db.orm.public.RolePermission.where({
        roleId: rolePerm.roleId,
        permissionId: permission.id,
      }).first()

      if (!existing) {
        await db.orm.public.RolePermission.create({
          roleId: rolePerm.roleId,
          permissionId: permission.id,
          canRead: hasPermission,
          canWrite: hasPermission,
          canDelete: hasPermission,
          canRestore: hasPermission,
          canUpdate: hasPermission,
        })
      }
    }
  }
}
