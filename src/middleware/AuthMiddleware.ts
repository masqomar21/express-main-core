import { NextFunction, Response, Request } from 'express'
import { verifyAccesToken } from '../utilities/JwtHanldler'
import { CONFIG } from '../config'
import prisma from '../config/database'
import { ResponseData } from '@/utilities/Response'

declare module 'express-serve-static-core' {
  interface Request {
    user?: jwtPayloadInterface;
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
      return ResponseData.unauthorized(res, 'Unauthorized - Invalid session')
    }

    const decode = verifyAccesToken(token, CONFIG.secret.jwtSecret)

    if (!decode) {
      return ResponseData.unauthorized(res, 'Unauthorized - Invalid token')
    }

    req.user = decode
    next()
    
  } catch (error: any) {
    return ResponseData.unauthorized(res, `Unauthorized - ${error.message || 'An error occurred'}`)
  }
}