import { Request, Response } from 'express'
import { validateInput } from '../../utilities/ValidateHandler'
import { LoginSchema, RegisterSchema } from '../../Schema/UserSchema'
import { StatusCodes } from 'http-status-codes'
import { ResponseData, serverErrorResponse } from '../../utilities'
import prisma from '../../config/database'
import { comparePassword, hashPassword } from '../../utilities/PasswordHandler'
import { generateAccesToken, jwtPayloadInterface } from '../../utilities/JwtHanldler'
import { CONFIG } from '../../config'
import { logActivity } from '../../utilities/LogActivity'

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
    } catch (error) {
      return serverErrorResponse(res, error)
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

      const token = generateAccesToken(tokenPayload, CONFIG.secret.jwtSecret, 3600 * 24) // 1 day

      await prisma.session.create({
        data: {
          token: token,
          userId: userData.id,
        },
      })

      await logActivity(userData.id, 'LOGIN', 'User login')

      const responseData = {
        ...userData,
        token,
      }

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', responseData))

    } catch (error ) {
      return serverErrorResponse(res, error)
    }
  },
  
  logout : async (req: Request, res: Response) => {
    const userLogin = req.user as jwtPayloadInterface

    try {
      await prisma.session.deleteMany({
        where: {
          userId: userLogin.id,
        },
      })

      await logActivity(userLogin.id, 'LOGOUT', 'User logout')

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success'))

    } catch (error) {
      return serverErrorResponse(res, error)
    }
  },

}


export default AuthController