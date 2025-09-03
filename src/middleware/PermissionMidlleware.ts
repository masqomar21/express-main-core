import prisma from '@/config/database'
import logger from '@/utilities/Log'
import { ResponseData } from '@/utilities/Response'
import { NextFunction, Request, Response } from 'express'



export const permissionMiddleware = (permission: PermissionList, action: 'canRead' | 'canWrite' | 'canUpdate' | 'canDelete' | 'canRestore' | 'all') => {
  return async ( req : Request, res : Response, next : NextFunction ) => {

    const userId = req.user?.id

    if (!userId) {
      return ResponseData.unauthorized(res, 'Unauthorized - No user ID found')
    }
    try {

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select : {
          role : {
            select : {
              name : true,
              roleType: true,
              rolePermissions : {
                select : {
                  permission : {
                    select : {
                      name : true,
                    },
                  },
                  canRead : true,
                  canWrite : true,
                  canUpdate : true,
                  canDelete : true,
                  canRestore : true,
                },
              },
            },
          },
        },
      })

      if (!user || !user.role) {
        return ResponseData.forbidden(res, 'No role assigned')
      }
      
      // allow to admin all previlage
      if(user.role.roleType === 'SUPER_ADMIN') {
        next()
        return
      } 
      const hasPermission: boolean = !!user?.role.rolePermissions.some(
        (perm) => perm.permission.name === permission && (action === 'all' || perm[action]),
      )

      if (!hasPermission) {
        return ResponseData.forbidden(res, `Forbidden - You do not have permission to ${action} ${permission}`)
      }

      next()
      return
    } catch (error) {
      logger.error(error)
      return ResponseData.serverError(res, error)
    }
  }
}

