import { CONFIG } from '@/config'
import prisma from '@/config/database'
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
      const userData = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      //   const cekUnique = await prisma.user.findFirst({
      //     where: {
      //       id: { not: userId },
      //       //   OR: [{ nik: validationResult.data!.nik }],
      //     },
      //   })
      //   if (cekUnique) {
      //     return ResponseData.badRequest(res, 'Email or NIK already exists')
      //   }

      const updatedUserData = await prisma.user.update({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
        data: {
          name: validationResult.data!.name,
        },
      })

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'UPDATE', `update user ${userData.name}`)
      await redisClient.del(`user_permissions:${updatedUserData.id}`)

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

      const userData = await prisma.user.findUnique({
        where: {
          id: userLogin.roleType === 'SUPER_ADMIN' && userId ? Number(userId) : userLogin.id,
        },
        include: {
          role: true,
        },
      })

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

      await prisma.user.update({
        where: { id: userData.id },
        data: { password: hashedNewPassword },
      })

      await prisma.session.deleteMany({
        where: { userId: userData.id },
      })

      let newToken = null

      if (!userId) {
        const tokenPayload: jwtPayloadInterface = {
          id: userData.id,
          name: userData.name as string,
          role: userData.role.roleType as string,
          roleType: userData.role.roleType as 'SUPER_ADMIN' | 'OTHER',
        }

        newToken = generateAccesToken(tokenPayload, CONFIG.secret.jwtSecret, 3600 * 24) // 1 day

        await prisma.session.create({
          data: {
            token: newToken,
            userId: userData.id,
          },
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
