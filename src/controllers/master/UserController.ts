import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import db from '@/config/database'
import { validateInput } from '@/utilities/ValidateHandler'
import { UserSchemaForCreate, UserSchemaForUpdate } from '@/schema/UserSchema'
import { hashPassword } from '@/utilities/PasswordHandler'
import { getIO } from '@/config/socket'
import { logActivity } from '@/utilities/LogActivity'
import { ResponseData } from '@/utilities/Response'
import redisClient from '@/config/redis'

const UserController = {
  getAllUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const { startDate, endDate } = req.query
      const page = new Pagination(req.query)

      let query = db.orm.public.User.where((u) => u.deletedAt.isNull())

      if (startDate && !isNaN(Date.parse(startDate as string))) {
        query = query.where((u) => u.createdAt.gte(new Date(startDate as string)))
      }

      if (endDate && !isNaN(Date.parse(endDate as string))) {
        const end = new Date(endDate as string)
        end.setHours(23, 59, 59, 999)
        query = query.where((u) => u.createdAt.lte(end))
      }

      const [userData, count] = await Promise.all([
        query
          .include('role', (r) => r.select('name'))
          .select('id', 'name', 'email')
          .orderBy((u) => u.id.desc())
          .offset(page.offset)
          .limit(page.limit)
          .all(),
        query.count(),
      ])

      return ResponseData.ok(res, page.paginate(Number(count), userData), 'Success get all ')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },
  getUserById: async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id as string)
      const userData = await db.orm.public.User.where({ id: userId }).first()

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      delete (userData as { password?: string }).password

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

      const existingUser = await db.orm.public.User.where({ email: reqBody.email }).first()
      if (existingUser) {
        return ResponseData.badRequest(res, 'Email already exists')
      }

      const cekRole = await db.orm.public.Role.where({ id: reqBody.roleId }).first()
      if (!cekRole) {
        return ResponseData.badRequest(res, 'Role not found')
      }

      const hashedPassword = await hashPassword(reqBody.password)

      const userData = await db.orm.public.User.create({
        ...validationResult.data!,
        password: hashedPassword,
      })

      delete (userData as { password?: string }).password

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
    const { id } = req.params
    const reqBody = req.body

    if (isNaN(Number(id))) {
      return ResponseData.badRequest(res, 'Invalid user id')
    }

    const validationResult = validateInput(UserSchemaForUpdate, reqBody)

    if (!validationResult.success) {
      return ResponseData.badRequest(res, 'Invalid Input', validationResult.errors)
    }
    try {
      const userData = await db.orm.public.User.where({ id: Number(id) }).first()

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      await db.orm.public.User.where({ id: Number(id) }).update(validationResult.data!)

      const updatedUserData = await db.orm.public.User.where({ id: Number(id) }).first()
      if (updatedUserData) {
        delete (updatedUserData as { password?: string }).password
      }

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

      const userData = await db.orm.public.User.where({ id: userId }).first()

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      await db.orm.public.User.where({ id: userId }).update({ deletedAt: new Date() })

      const deletedUserData = await db.orm.public.User.where({ id: userId }).first()

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

      const userData = await db.orm.public.User.where({ id: userId }).first()

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      await db.orm.public.User.where({ id: userId }).update({ deletedAt: null })

      const restoredUserData = await db.orm.public.User.where({ id: userId }).first()

      return ResponseData.ok(res, restoredUserData, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  deleteUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id as string)

      const userData = await db.orm.public.User.where({ id: userId }).first()

      if (!userData) {
        return ResponseData.notFound(res, 'User not found')
      }

      await db.orm.public.User.where({ id: userId }).delete()

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'DELETE', `delete user ${userData.name}`)

      return ResponseData.ok(res, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default UserController
