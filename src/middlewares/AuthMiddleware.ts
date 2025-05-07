import { NextFunction, Response, Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import { JwtPayloadInterface, verifyAccessToken } from '../core/jwt'
import { ResponseData } from '../core/response'
import { CONFIG } from '../config'
import { prisma } from '../config/database'

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayloadInterface;
  }
}


export const AuthMiddleware = async function (req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader ? authHeader.split(' ')[1] : undefined

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json(ResponseData(StatusCodes.UNAUTHORIZED, 'Unauthorized'))
  }

  try {

    const cekSesionInDb = await prisma.session.findUnique({
      where: {
        token: token,
      },
    })

    if (!cekSesionInDb) {
      return res.status(StatusCodes.UNAUTHORIZED).json(ResponseData(StatusCodes.UNAUTHORIZED, 'Unauthorized'))
    }

    const decode = verifyAccessToken(token, CONFIG.secret.jwtSecret)

    if (!decode) {
      return res.status(StatusCodes.UNAUTHORIZED).json(ResponseData(StatusCodes.UNAUTHORIZED, 'Unauthorized'))
    }

    req.user = decode
    next()
    
  } catch (error: any) {
    return res.status(StatusCodes.UNAUTHORIZED).json(ResponseData(StatusCodes.UNAUTHORIZED, 'Unauthorized')) 
  }
}