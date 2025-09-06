import prisma from '@/config/database'
import redisClient from '@/config/redis'
import { RoleSchema } from '@/schema/RoleScehma'
import { logActivity } from '@/utilities/LogActivity'
import { Pagination } from '@/utilities/Pagination'
import { ResponseData } from '@/utilities/Response'
import { validateInput } from '@/utilities/ValidateHandler'
import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'


const RoleController = {
  async getAllPermission(req: Request, res: Response) :Promise<Response> {
    try {
      const permissions = await prisma.permissions.findMany()
      return ResponseData.ok(res, permissions, 'Success get all permissions')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  async getAllRole(req: Request, res: Response) :Promise<Response> {
    const { search } = req.query

    const paginate = new Pagination(
      Number(req.query.page) || 1,
      Number(req.query.limit) || 10,
    )

    const whereCondition : Prisma.RoleWhereInput = {}

    if (search) {
      whereCondition.name = {
        contains: String(search),
        mode: 'insensitive',
      }
    }

    try {
      const [roles, count] = await Promise.all([
        prisma.role.findMany({
          where : whereCondition,
          take : paginate.limit,
          skip : paginate.offset,
          orderBy : {
            id: 'asc',
          },
        }),
        prisma.role.count({
          where: whereCondition,
        }),
      ])
      return ResponseData.ok(res, paginate.paginate({ count, rows: roles }), 'Success get all roles')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  async getRoleById(req: Request, res: Response) :Promise<Response> {
    const { roleId } = req.params

    try {
      const role = await prisma.role.findUnique({
        where: { id: Number(roleId) },
        select : {
          name : true,
          roleType : true,
          rolePermissions : {
            select : {
              id: true,
              permission : {
                select : {
                  id: true,
                  name : true,
                },
              },
              canRead : true,
              canWrite : true,
              canRestore : true,
              canUpdate : true,
              canDelete : true,

            },
          },
        },
      })
      if (!role) {
        return ResponseData.notFound(res, 'Role not found')
      }
      return ResponseData.ok(res, role, 'Success get role by id')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  async createRole(req: Request, res: Response) :Promise<Response> {

    const validationResult = validateInput(RoleSchema, req.body)

    if (!validationResult.success) {
      return ResponseData.badRequest(res, undefined, validationResult.errors)
    }

    const reqBody = validationResult.data!
    try {
      const role = await prisma.role.create({
        data : {
          name : reqBody.name,
          roleType : 'OTHER',
        },
      })

      const rolePermissions = reqBody.permissions.map((permission) => ({
        permissionId: permission.permissionId,
        canRead: permission.canRead,
        canWrite: permission.canWrite,
        canRestore: permission.canRestore,
        canUpdate: permission.canUpdate,
        canDelete: permission.canDelete,
        roleId: role.id,
      }))

      await prisma.rolePermission.createMany({
        data: rolePermissions,
      })
      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'CREATE', 'Tambah Role' + role.name)

      return ResponseData.created(res, null, 'Success create role')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async updateRole(req: Request, res: Response) :Promise<Response> {
    const { roleId } = req.params

    const validationResult = validateInput(RoleSchema, req.body)

    if (!validationResult.success) {
      return ResponseData.badRequest(res, undefined, validationResult.errors)
    }

    const reqBody = validationResult.data!
    try {

      const cekRole = await prisma.role.findUnique({
        where: { id: Number(roleId) },
        include : {
          rolePermissions: true,
        },
      })

      if (!cekRole) {
        return ResponseData.notFound(res, 'Role not found')
      }

      const role = await prisma.role.update({
        where: { id: Number(roleId) },
        data: {
          name: reqBody.name,
          roleType: 'OTHER',
        },
      })

      const incommingRolePermission = reqBody.permissions
      const existingRolePermissionIds = cekRole.rolePermissions.map((permission) => permission.id)

      const rolePermissionsToCreate = incommingRolePermission.filter((permission) => permission.id === undefined)

      const rolePermissionsToUpdate = incommingRolePermission.filter((permission) => permission.id !== undefined && permission.id !== null &&  existingRolePermissionIds.includes(permission.id!))

      const incommingRolePermissionIds = incommingRolePermission.map((permission) => permission.id).filter((id) => id !== undefined && id !== null)

      const rolePermissionsToDelete = existingRolePermissionIds.filter((id) => !incommingRolePermissionIds.includes(id))

      if (rolePermissionsToCreate.length > 0) {
        await prisma.rolePermission.createMany({
          data: rolePermissionsToCreate.map(item => {
            return {
              permissionId: item.permissionId,
              canRead: item.canRead,
              canWrite: item.canWrite,
              canRestore: item.canRestore,
              canUpdate: item.canUpdate,
              canDelete: item.canDelete,
              roleId: role.id,
            }
          }),
        })
      }

      if (rolePermissionsToUpdate.length > 0) {
        await Promise.all(rolePermissionsToUpdate.map((permission) => {
          return prisma.rolePermission.update({
            where: { id: permission.id! },
            data: {
              canRead: permission.canRead,
              canWrite: permission.canWrite,
              canRestore: permission.canRestore,
              canUpdate: permission.canUpdate,
              canDelete: permission.canDelete,
            },
          })
        }))
      }

      if (rolePermissionsToDelete.length > 0) {
        await prisma.rolePermission.deleteMany({
          where: { id: { in: rolePermissionsToDelete } },
        })
      }

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'UPDATE', 'Mengubah Role' + role.name)
      await redisClient.deleteKeysByPattern('user_permissions:*')


      return ResponseData.ok(res, null, 'Success update role')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
  async deleteRole(req: Request, res: Response) :Promise<Response> {
    const { roleId } = req.params
    
    try {
      const cekRole = await prisma.role.findUnique({
        where: { id: Number(roleId) },
      })
    
      if (!cekRole) {
        return ResponseData.notFound(res, 'Role not found')
      }
    
      await prisma.rolePermission.deleteMany({
        where: { roleId: Number(roleId) },
      })
    
      await prisma.role.delete({
        where: { id: Number(roleId) },
      })


      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'DELETE', 'Hapus Role' + cekRole.name)

    
      return ResponseData.ok(res, null, 'Success delete role')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

}


export default RoleController