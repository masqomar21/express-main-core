import prisma from '@/config/database'
import redisClient from '@/config/redis'
import logger from '@/utilities/Log'
import { ResponseData } from '@/utilities/Response'
import { NextFunction, Request, Response } from 'express'


export const permissionMiddleware = (permission: PermissionList, action: 'canRead' | 'canWrite' | 'canUpdate' | 'canDelete' | 'canRestore' | 'all') => {
  return async ( req : Request, res : Response, next : NextFunction ) => {

    const userLogin = req.user as jwtPayloadInterface
    const permissionList = res.locals.permissionList as GeneratedPermissionList[] | undefined

    if (!permissionList) {
      return ResponseData.forbidden(res, 'No permissions found')
    }

    // allow to admin all previlage
    if(userLogin.roleType === 'SUPER_ADMIN') {
      next()
      return
    } 
    const hasPermission: boolean = !!permissionList.some(
      (perm) => perm.permission === permission && (action === 'all' || perm[action]),
    )

    if (!hasPermission) {
      return ResponseData.forbidden(res, `Forbidden - You do not have permission to ${action} ${permission}`)
    }

    next()
    return
  }
}

declare module 'express-serve-static-core' {
  interface Locals {
    permissionList?: GeneratedPermissionList[];
  }
}


export const generatePermissionList = async function (req: Request, res: Response, next: NextFunction) {
  const userLogin = req.user as jwtPayloadInterface
  try {
    if (!userLogin) {
      return ResponseData.unauthorized(res, 'Unauthorized - No user ID found')
    }

    const key = `user_permissions:${userLogin.id}`

    const cacheData = await redisClient.get(key)
    if (cacheData) {
      console.log('Using cached permissions')
      res.locals.permissionList = JSON.parse(cacheData) as GeneratedPermissionList[]
      return next()
    }

    const userPermissions = await prisma.user.findUnique({
      where: { id: userLogin.id },
      select: {
        role: {
          select: {
            rolePermissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                  },
                },
                canRead: true,
                canWrite: true,
                canUpdate: true,
                canDelete: true,
                canRestore: true,
              },
            },
          },
        },
      },
    })

    console.log('Fetching permissions from database')
    if (!userPermissions) {
      return ResponseData.forbidden(res, 'No permissions found')
    }

    const permissionList : GeneratedPermissionList[] = userPermissions.role.rolePermissions.map((perm) => ({
      permission: perm.permission.name as PermissionList,
      canRead: perm.canRead,
      canWrite: perm.canWrite,
      canUpdate: perm.canUpdate,
      canDelete: perm.canDelete,
      canRestore: perm.canRestore,
    }))

    await redisClient.set(key, JSON.stringify(permissionList), 3600) // Cache selama 1 jam (3600 detik)

    res.locals.permissionList = permissionList
    next()
    return
  } catch (error) {
    logger.error(error)
    return ResponseData.serverError(res, error)
  }
}


