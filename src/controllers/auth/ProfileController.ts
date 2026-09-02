import { CONFIG } from '@/config'
import db from '@/config/database'
import redisClient from '@/config/redis'
import { ChangePasswordSchema, ProfileSchemaForUpdate } from '@/schema/UserSchema'
import { generateAccesToken } from '@/utilities/JwtHanldler'
import { logActivity } from '@/utilities/LogActivity'
import { comparePassword, hashPassword } from '@/utilities/PasswordHandler'
import { ResponseData } from '@/utilities/Response'
import { validateInput } from '@/utilities/ValidateHandler'
import { Request, Response } from 'express'

const ProfileController = {
  updateUser: async (req: Request, res: Response): Promise<any> => {
    const reqBody = req.body

    const userLogin = req.user as jwtPayloadInterface

    const userId = userLogin.id

    const validationResult = validateInput(ProfileSchemaForUpdate, reqBody)

    if (!validationResult.success) {
      return ResponseData.badRequest(res, 'Invalid Input', validationResult.errors)
    }

    try {
      const userData = await db.orm.public.User.where({ id: userId }).first()

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      await db.orm.public.User.where({ id: userId }).update({
        name: validationResult.data!.name,
      })

      const updatedUserData = await db.orm.public.User.select('id', 'name', 'email')
        .where({ id: userId })
        .first()

      await logActivity(userLogin.id, 'UPDATE', `update user ${userData.name}`)
      await redisClient.del(`user_permissions:${updatedUserData!.id}`)

      return ResponseData.ok(res, updatedUserData, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  async changePassword(req: Request, res: Response): Promise<any> {
    try {
      const userLogin = req.user as jwtPayloadInterface
      const { userId } = req.query

      const validationResult = validateInput(ChangePasswordSchema, req.body)
      if (!validationResult.success) {
        return ResponseData.badRequest(res, undefined, validationResult.errors)
      }

      if (!userId && validationResult.data!.oldPassword === undefined) {
        return ResponseData.badRequest(res, 'Old password is required')
      }

      const targetId =
        userLogin.roleType === 'SUPER_ADMIN' && userId ? Number(userId) : userLogin.id

      const userData = await db.orm.public.User.include('role').where({ id: targetId }).first()

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      if (!userId) {
        const isOldPasswordValid = await comparePassword(
          validationResult.data!.oldPassword ?? '',
          userData.password!,
        )
        if (!isOldPasswordValid) {
          return ResponseData.badRequest(res, 'Old password is incorrect')
        }
      }

      const hashedNewPassword = await hashPassword(validationResult.data!.newPassword)

      await db.orm.public.User.where({ id: userData.id }).update({
        password: hashedNewPassword,
      })

      await db.orm.public.Session.where({ userId: userData.id }).delete()

      let newToken = null

      if (!userId) {
        const tokenPayload: jwtPayloadInterface = {
          id: userData.id,
          name: userData.name as string,
          role: userData.role.roleType as string,
          roleType: userData.role.roleType as 'SUPER_ADMIN' | 'OTHER',
          purpose: 'ACCESS_TOKEN',
        }

        const { token, jti } = generateAccesToken(tokenPayload, CONFIG.secret.jwtSecret, 3600 * 24) // 1 day
        newToken = token

        await db.orm.public.Session.create({
          token: jti,
          userId: userData.id,
        })
      }

      await logActivity(userData.id, 'UPDATE', `change password user ${userData.name}`)

      return ResponseData.ok(res, { token: newToken }, 'Password changed successfully')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default ProfileController
