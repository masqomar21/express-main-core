import db from '@/config/database'
import redisClient from '@/config/redis'
import { RoleSchema } from '@/schema/RoleScehma'
import { logActivity } from '@/utilities/LogActivity'
import { Pagination } from '@/utilities/Pagination'
import { ResponseData } from '@/utilities/Response'
import { validateInput } from '@/utilities/ValidateHandler'
import { Request, Response } from 'express'

const RoleController = {
  async getAllPermission(req: Request, res: Response): Promise<Response> {
    try {
      const permissions = await db.orm.public.Permissions.all()
      return ResponseData.ok(res, permissions, 'Success get all permissions')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  async getAllRole(req: Request, res: Response): Promise<Response> {
    const { search } = req.query

    const paginate = new Pagination(req.query)

    try {
      const baseFilter = search ? { name: String(search) } : {}

      const [roles, count] = await Promise.all([
        db.orm.public.Role.where(baseFilter)
          .orderBy((r) => r.id.asc())
          .offset(paginate.offset)
          .limit(paginate.limit)
          .all(),
        db.orm.public.Role.where(baseFilter).count(),
      ])
      return ResponseData.ok(res, paginate.paginate(Number(count), roles), 'Success get all roles')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  async getRoleById(req: Request, res: Response): Promise<Response> {
    const { roleId } = req.params

    try {
      const role = await db.orm.public.Role.include('rolePermissions', (rp) =>
        rp.include('permission'),
      )
        .where({ id: Number(roleId) })
        .first()

      if (!role) {
        return ResponseData.notFound(res, 'Role not found')
      }

      const formattedRole = {
        name: role.name,
        roleType: role.roleType,
        rolePermissions: role.rolePermissions.map((rp) => ({
          id: rp.id,
          permission: {
            id: rp.permission.id,
            name: rp.permission.name,
          },
          canRead: rp.canRead,
          canWrite: rp.canWrite,
          canRestore: rp.canRestore,
          canUpdate: rp.canUpdate,
          canDelete: rp.canDelete,
        })),
      }

      return ResponseData.ok(res, formattedRole, 'Success get role by id')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  async createRole(req: Request, res: Response): Promise<Response> {
    const validationResult = validateInput(RoleSchema, req.body)

    if (!validationResult.success) {
      return ResponseData.badRequest(res, undefined, validationResult.errors)
    }

    const reqBody = validationResult.data!
    try {
      const role = await db.orm.public.Role.create({
        name: reqBody.name,
        roleType: 'OTHER',
      })

      await Promise.all(
        reqBody.permissions.map((permission) =>
          db.orm.public.RolePermission.create({
            permissionId: permission.permissionId,
            canRead: permission.canRead,
            canWrite: permission.canWrite,
            canRestore: permission.canRestore,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
            roleId: role.id,
          }),
        ),
      )

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'CREATE', 'Tambah Role' + role.name)

      return ResponseData.created(res, null, 'Success create role')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async updateRole(req: Request, res: Response): Promise<Response> {
    const { roleId } = req.params

    const validationResult = validateInput(RoleSchema, req.body)

    if (!validationResult.success) {
      return ResponseData.badRequest(res, undefined, validationResult.errors)
    }

    const reqBody = validationResult.data!
    try {
      const cekRole = await db.orm.public.Role.include('rolePermissions')
        .where({ id: Number(roleId) })
        .first()

      if (!cekRole) {
        return ResponseData.notFound(res, 'Role not found')
      }

      await db.orm.public.Role.where({ id: Number(roleId) }).update({
        name: reqBody.name,
        roleType: 'OTHER',
      })

      const incommingRolePermission = reqBody.permissions
      const existingRolePermissionIds = cekRole.rolePermissions.map((permission) => permission.id)

      const rolePermissionsToCreate = incommingRolePermission.filter(
        (permission) => permission.id === undefined,
      )

      const rolePermissionsToUpdate = incommingRolePermission.filter(
        (permission) =>
          permission.id !== undefined &&
          permission.id !== null &&
          existingRolePermissionIds.includes(permission.id!),
      )

      const incommingRolePermissionIds = incommingRolePermission
        .map((permission) => permission.id)
        .filter((id) => id !== undefined && id !== null)

      const rolePermissionsToDelete = existingRolePermissionIds.filter(
        (id) => !incommingRolePermissionIds.includes(id as number),
      )

      if (rolePermissionsToCreate.length > 0) {
        await Promise.all(
          rolePermissionsToCreate.map((item) =>
            db.orm.public.RolePermission.create({
              permissionId: item.permissionId,
              canRead: item.canRead,
              canWrite: item.canWrite,
              canRestore: item.canRestore,
              canUpdate: item.canUpdate,
              canDelete: item.canDelete,
              roleId: cekRole.id,
            }),
          ),
        )
      }

      if (rolePermissionsToUpdate.length > 0) {
        await Promise.all(
          rolePermissionsToUpdate.map((permission) =>
            db.orm.public.RolePermission.where({ id: permission.id! }).update({
              canRead: permission.canRead,
              canWrite: permission.canWrite,
              canRestore: permission.canRestore,
              canUpdate: permission.canUpdate,
              canDelete: permission.canDelete,
            }),
          ),
        )
      }

      if (rolePermissionsToDelete.length > 0) {
        await Promise.all(
          rolePermissionsToDelete.map((id) =>
            db.orm.public.RolePermission.where({ id: Number(id) }).delete(),
          ),
        )
      }

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'UPDATE', 'Mengubah Role' + cekRole.name)
      await redisClient.deleteKeysByPattern('user_permissions:*')

      return ResponseData.ok(res, null, 'Success update role')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
  async deleteRole(req: Request, res: Response): Promise<Response> {
    const { roleId } = req.params

    try {
      const cekRole = await db.orm.public.Role.where({ id: Number(roleId) }).first()

      if (!cekRole) {
        return ResponseData.notFound(res, 'Role not found')
      }

      await db.orm.public.RolePermission.where({
        roleId: Number(roleId),
      }).delete()

      await db.orm.public.Role.where({ id: Number(roleId) }).delete()

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'DELETE', 'Hapus Role' + cekRole.name)

      return ResponseData.ok(res, null, 'Success delete role')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default RoleController
