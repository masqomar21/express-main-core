import { Request, Response } from 'express'
import { validateInput } from '../../utils/validateHandler'
import { LoginSchema, RegisterSchema } from '../user/user.schema'
import { StatusCodes } from 'http-status-codes'
import { ResponseData } from '../../core/response'
import { prisma } from '../../config/database'
import { comparePassword, hashPassword } from '../../core/password'
import { logger } from '../../core/logger'
import { generateAccessToken } from '../../core/jwt'
import { CONFIG } from '../../config'
import { logActivity } from '../../core/logActivity'

const AuthController = {

  
  register : async (req: Request, res: Response) => {
    const reqBody = req.body
      
    const validationResult = validateInput(RegisterSchema, reqBody)
      
    if (!validationResult.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(
          ResponseData(
            StatusCodes.BAD_REQUEST,
            'Invalid Input',
            validationResult.errors,
          ),
        )
    }
    try {

      const cekExistingRole = await prisma.role.findUnique({
        where: { id: reqBody.roleId },
      })

      if (!cekExistingRole) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json(
            ResponseData(
              StatusCodes.BAD_REQUEST,
              'Role not found',
            ),
          )
      }
      
      reqBody.password = await hashPassword(reqBody.password)

      const userData = await prisma.user.create({
        data: {
          name: reqBody.name,
          email: reqBody.email,
          password: reqBody.password,
          roleId: cekExistingRole.id,
        },
      })

      return res
        .status(StatusCodes.CREATED)
        .json(ResponseData(StatusCodes.CREATED, 'Success', userData))
    } catch (error: any) {
      logger.error(error)
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          ResponseData(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Internal server error' + error.message,
          ),
        )
    }
  },
  login : async (req: Request, res: Response) => {
    const reqBody = req.body

    const validationResult = validateInput(LoginSchema, reqBody)

    if (!validationResult.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(
          ResponseData(
            StatusCodes.BAD_REQUEST,
            'Invalid Input',
            validationResult.errors,
          ),
        )
    }

    try {
      const userData = await prisma.user.findUnique(
        {
          where: {
            email: reqBody.email,
          },
          include : { role : true },
        },
      )

      if (!userData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'User not found'))
      }

      const passwordMatch = await comparePassword(reqBody.password, userData.password as string)

      if (!passwordMatch) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json(ResponseData(StatusCodes.UNAUTHORIZED, 'Password not match'))
      }
      const tokenPayload = {
        id: userData.id,
        name: userData.name as string,
        role: userData.role.name,
      }

      const token = generateAccessToken(tokenPayload, CONFIG.secret.jwtSecret, 3600 * 24) // 1 day

      await prisma.session.create({
        data: {
          token: token,
          userId: userData.id,
        },
      })

      await logActivity(userData.id, 'login', 'User login')

      const responseData = {
        ...userData,
        token,
      }

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', responseData))

    } catch (error : any) {
      logger.error(error)
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          ResponseData(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Internal server error' + error.message,
          ))
    }
  },
  
  logout: async (req: Request & { user?: import('../../core/jwt').JwtPayloadInterface }, res: Response) => {
    const userLogin = req.user
  
    if (!userLogin) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ResponseData(StatusCodes.UNAUTHORIZED, 'Unauthorized'))
    }
  
    try {
      await prisma.session.deleteMany({
        where: {
          userId: userLogin.id,
        },
      })
  
      await logActivity(userLogin.id, 'logout', 'User logout')
  
      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success'))
    } catch (error: any) {
      logger.error(error)
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          ResponseData(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Internal server error: ' + error.message,
          ),
        )
    }
  },
  

}


export default AuthController