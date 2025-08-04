import { Request, Response } from 'express'
import { validateInput } from '../../utilities/ValidateHandler'
import { LoginSchema, RegisterSchema } from '../../Schema/UserSchema'
import prisma from '../../config/database'
import { comparePassword, hashPassword } from '../../utilities/PasswordHandler'
import { generateAccesToken } from '../../utilities/JwtHanldler'
import { CONFIG } from '../../config'
import { logActivity } from '../../utilities/LogActivity'
import { ResponseData } from '@/utilities/Response'

const AuthController = {
  register : async (req: Request, res: Response) => {
    const reqBody = req.body
      
    const validationResult = validateInput(RegisterSchema, reqBody)
      
    if (!validationResult.success) {
      return ResponseData.badRequest(res, 'Invalid Input', validationResult.errors)
    }
    try {

      const cekExistingRole = await prisma.role.findUnique({
        where: { id: reqBody.roleId },
      })

      if (!cekExistingRole) {
        return ResponseData.badRequest(res, 'Role not found')
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

      return ResponseData.created(res, userData, 'Success')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
  login : async (req: Request, res: Response) => {
    const reqBody = req.body

    const validationResult = validateInput(LoginSchema, reqBody)

    if (!validationResult.success) {
      return ResponseData.badRequest(res, 'Invalid Input', validationResult.errors)
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
        return ResponseData.notFound(res, 'User not found')
      }

      const passwordMatch = await comparePassword(reqBody.password, userData.password as string)

      if (!passwordMatch) {
        return ResponseData.unauthorized(res, 'Password not match')
      }

      // test
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

      return ResponseData.ok(res, responseData, 'Success')

    } catch (error ) {
      return ResponseData.serverError(res, error)
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

      return ResponseData.ok(res, 'Success')

    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

}


export default AuthController