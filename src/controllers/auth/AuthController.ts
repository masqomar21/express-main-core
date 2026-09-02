import { Request, Response } from 'express'
import { validateInput } from '../../utilities/ValidateHandler'
import { LoginSchema, RegisterSchema } from '../../schema/UserSchema'
import db from '../../config/database'
import { comparePassword, hashPassword } from '../../utilities/PasswordHandler'
import { generateAccesToken } from '../../utilities/JwtHanldler'
import { CONFIG } from '../../config'
import { logActivity } from '../../utilities/LogActivity'
import { ResponseData } from '@/utilities/Response'

const AuthController = {
  register: async (req: Request, res: Response) => {
    const validationResult = validateInput(RegisterSchema, req.body)

    if (!validationResult.success) {
      return ResponseData.badRequest(res, 'Invalid Input', validationResult.errors)
    }
    const reqBody = validationResult.data!
    try {
      // ajust asign role OTHER
      const cekExistingRole = await db.orm.public.Role.where({ roleType: 'OTHER' }).first()

      if (!cekExistingRole) {
        return ResponseData.badRequest(res, 'Role not found')
      }

      reqBody.password = await hashPassword(reqBody.password)

      const userData = await db.orm.public.User.create({
        name: reqBody.name,
        email: reqBody.email,
        password: reqBody.password,
        roleId: cekExistingRole.id,
      })

      return ResponseData.created(res, userData, 'Success')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
  login: async (req: Request, res: Response) => {
    const reqBody = req.body

    const validationResult = validateInput(LoginSchema, reqBody)

    if (!validationResult.success) {
      return ResponseData.badRequest(res, 'Invalid Input', validationResult.errors)
    }

    try {
      const userData = await db.orm.public.User.include('role').where({
        email: reqBody.email,
      }).first()

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      const passwordMatch = await comparePassword(reqBody.password, userData.password as string)

      if (!passwordMatch) {
        return ResponseData.unauthorized(res, 'Password not match')
      }

      // test
      const tokenPayload: jwtPayloadInterface = {
        id: userData.id,
        name: userData.name as string,
        role: String(userData.role.name),
        roleType: userData.role.roleType as 'SUPER_ADMIN' | 'OTHER',
        purpose: 'ACCESS_TOKEN',
      }

      const { token, jti } = generateAccesToken(tokenPayload, CONFIG.secret.jwtSecret, 3600 * 24) // 1 day

      await db.orm.public.Session.create({
        token: jti,
        userId: userData.id,
      })

      await logActivity(userData.id, 'LOGIN', 'User login')

      const responseData = {
        ...userData,
        token,
      }

      return ResponseData.ok(res, responseData, 'Success', {
        allowedSensitiveKeys: 'token',
      })
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async getUserProfile(req: Request, res: Response): Promise<Response> {
    const userLogin = req.user as jwtPayloadInterface

    try {
      const userData = await db.orm.public.User.include('role', (r) =>
        r.include('rolePermissions', (rp) => rp.include('permission')),
      )
        .where({ id: userLogin.id })
        .first()

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }
      const mappedPermissions: string[] = []

      userData.role.rolePermissions.forEach((permission) => {
        if (permission.canRead) {
          mappedPermissions.push(`read:${permission.permission.name}`)
        }
        if (permission.canWrite) {
          mappedPermissions.push(`write:${permission.permission.name}`)
        }
        if (permission.canUpdate) {
          mappedPermissions.push(`update:${permission.permission.name}`)
        }
        if (permission.canRestore) {
          mappedPermissions.push(`restore:${permission.permission.name}`)
        }
        if (permission.canDelete) {
          mappedPermissions.push(`delete:${permission.permission.name}`)
        }
      })

      return ResponseData.ok(
        res,
        {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          registeredViaGoogle: userData.registeredViaGoogle,
          role: {
            name: userData.role.name,
            roleType: userData.role.roleType,
            rolePermissions: mappedPermissions,
          },
        },
        'User profile retrieved successfully',
      )
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  logout: async (req: Request, res: Response) => {
    const userLogin = req.user as jwtPayloadInterface
    const authHeader = req.headers['authorization']
    const token = authHeader ? authHeader.split(' ')[1] : undefined

    if (!token) {
      return ResponseData.unauthorized(res, 'Unauthorized - No token provided')
    }

    try {
      const deletedSession = await db.orm.public.Session.where({
        token: token,
      }).delete()

      if (!deletedSession || (Array.isArray(deletedSession) && deletedSession.length === 0)) {
        return ResponseData.unauthorized(res, 'Session not found or already invalidated')
      }

      await logActivity(userLogin.id, 'LOGOUT', 'User logout')

      return ResponseData.ok(res, 'Success')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default AuthController
