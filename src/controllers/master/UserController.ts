import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { validateInput } from '@/utilities/ValidateHandler'
import { UserSchemaForCreate, UserSchemaForUpdate } from '@/schema/UserSchema'
import { hashPassword } from '@/utilities/PasswordHandler'
import { getIO } from '@/config/socket'
import { logActivity } from '@/utilities/LogActivity'
import { ResponseData } from '@/utilities/Response'
import redisClient from '@/config/redis'

const UserController = {
  getAllUser : async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )

      const userLogin = req.user

      console.log(userLogin?.role)

      const whereCondition = {
        deletedAt: null,
      }

      const [userData, count] = await Promise.all([
        prisma.user.findMany({
          where: whereCondition,
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.user.count({
          where: whereCondition,
        }),
      ])

      return ResponseData.ok(
        res,
        page.paginate({
          count,
          rows: userData,
        }),
        'Success get all ',
      )
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },
  getUserById: async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id as string)
      const userData = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      return ResponseData.ok(res, userData, 'Success get user by id')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  createUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const reqBody = req.body
      const userLogin = req.user as jwtPayloadInterface

      const validationResult = validateInput(UserSchemaForCreate, reqBody)

      if (!validationResult.success) {
        return ResponseData.badRequest(res, 'Invalid Input', validationResult.errors)
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: reqBody.email },
      })
      if (existingUser) {
        return ResponseData.badRequest(res, 'Email already exists')
      }

      const cekRole = await prisma.role.findUnique({
        where: { id: reqBody.roleId },
      })
      if (!cekRole) {
        return ResponseData.badRequest(res, 'Role not found')
      }

      validationResult.data!.password = await hashPassword(reqBody.password)

      const userData = await prisma.user.create({
        data: validationResult.data!,
      })

      // soket create user
      getIO().emit('create-user', userData)

      // loger create user wajib untuk setiap create 
      await logActivity(userLogin.id, 'CREATE', `Create user ${userData.name}`)

      return ResponseData.created(res, userData, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  updateUser: async (req: Request, res: Response): Promise<any> => {
    const userId = parseInt(req.params.id as string)
    const reqBody = req.body

    const validationResult = validateInput(UserSchemaForUpdate, reqBody)

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

      const updatedUserData = await prisma.user.update({
        where: { id: userId },
        data: validationResult.data!,
      })

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'UPDATE', `update user ${userData.name}`)
      await redisClient.del(`user_permissions:${userData.id}`)

      return ResponseData.ok(res, updatedUserData, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },
  softDeleteUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id as string)

      const userData = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      const deletedUserData = await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      })


      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'DELETE', `delete user ${userData.name}`)

      return ResponseData.ok(res, deletedUserData, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  restoreUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id as string)

      const userData = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      const deletedUserData = await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: null },
      })

      return ResponseData.ok(res, deletedUserData, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  deleteUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id as string)

      const userData = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }
      

      await prisma.user.delete({
        where: { id: userId },
      })

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'DELETE', `delete user ${userData.name}`)

      return ResponseData.ok(res, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default UserController
