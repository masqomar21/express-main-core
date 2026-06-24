import { NextFunction, Response, Request } from 'express'
import { verifyAccesToken } from '../utilities/JwtHanldler'
import { CONFIG } from '../config'
import prisma from '../config/database'
import { ResponseData } from '@/utilities/Response'

declare module 'express-serve-static-core' {
  interface Request {
    user?: jwtPayloadInterface
  }
}

export const AuthMiddleware = async function (req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader ? authHeader.split(' ')[1] : undefined

  if (!token) {
    return ResponseData.unauthorized(res, 'Unauthorized - No token provided')
  }

  try {
    const cekSesionInDb = await prisma.session.findUnique({
      where: {
        token: token,
      },
    })

    if (!cekSesionInDb) {
      return ResponseData.otherResponse(res, 498, 'Unauthorized - Invalid session')
    }

    const decode = verifyAccesToken(token, CONFIG.secret.jwtSecret)

    if (!decode || decode.purpose !== 'ACCESS_TOKEN') {
      return ResponseData.otherResponse(res, 498, 'Unauthorized - Invalid token')
    }

    req.user = decode
    next()
  } catch (error: any) {
    return ResponseData.unauthorized(res, `Unauthorized - ${error.message || 'An error occurred'}`)
  }
}

/**
 * Role Middleware - Memvalidasi apakah user memiliki role yang diperlukan
 * Harus digunakan SETELAH AuthMiddleware
 * @param requiredRoles - Role type atau array dari role types yang diizinkan
 * @returns Middleware function
 * @example
 * router.get('/admin', AuthMiddleware, RoleMiddleware('SUPER_ADMIN'), controllerFunction)
 * router.get('/multi', AuthMiddleware, RoleMiddleware(['SUPER_ADMIN', 'OTHER']), controllerFunction)
 */
export const RoleMiddleware = (requiredRoles: JwtRoleType | JwtRoleType[]) => {
  return async function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return ResponseData.unauthorized(res, 'Unauthorized - No user found')
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

    if (!roles.includes(req.user.roleType)) {
      return ResponseData.otherResponse(
        res,
        403,
        `Forbidden - Required role(s): ${roles.join(', ')}. Your role: ${req.user.roleType}`,
      )
    }

    next()
  }
}
