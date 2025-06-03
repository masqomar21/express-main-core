import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { jwtPayloadInterface } from '@/utilities/JwtHanldler'
import { validateInput } from '@/utilities/ValidateHandler'
import { UserSchemaForCreate, UserSchemaForUpdate } from '@/Schema/UserSchema'
import { hashPassword } from '@/utilities/PasswordHandler'
import { getIO } from '@/config/socket'
import { logActivity } from '@/utilities/LogActivity'

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

      return res
        .status(StatusCodes.OK)
        .json(
          ResponseData(
            StatusCodes.OK,
            'Success',
            page.paginate({ count, rows: userData }),
          ),
        )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  getUserById: async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id as string)
      const userData = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'User not found'))
      }

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', userData))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },

  createUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const reqBody = req.body
      const userLogin = req.user as jwtPayloadInterface

      const validationResult = validateInput(UserSchemaForCreate, reqBody)

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

      const existingUser = await prisma.user.findUnique({
        where: { email: reqBody.email },
      })
      if (existingUser) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json(ResponseData(StatusCodes.BAD_REQUEST, 'Email already exists'))
      }

      const cekRole = await prisma.role.findUnique({
        where: { id: reqBody.roleId },
      })
      if (!cekRole) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json(ResponseData(StatusCodes.BAD_REQUEST, 'Role not found'))
      }

      validationResult.data!.password = await hashPassword(reqBody.password)

      const userData = await prisma.user.create({
        data: validationResult.data!,
      })

      // soket create user
      getIO().emit('create-user', userData)

      // loger create user wajib untuk setiap create 
      await logActivity(userLogin.id, 'CREATE', `Create user ${userData.name}`)

      return res
        .status(StatusCodes.CREATED)
        .json(ResponseData(StatusCodes.CREATED, 'Success', userData))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },

  updateUser: async (req: Request, res: Response): Promise<any> => {
    const userId = parseInt(req.params.id as string)
    const reqBody = req.body

    const validationResult = validateInput(UserSchemaForUpdate, reqBody)

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

      const userData = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'User not found'))
      }

      const updatedUserData = await prisma.user.update({
        where: { id: userId },
        data: validationResult.data!,
      })

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'UPDATE', `update user ${userData.name}`)

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', updatedUserData))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  softDeleteUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id as string)

      const userData = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'User not found'))
      }

      const deletedUserData = await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      })


      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'DELETE', `delete user ${userData.name}`)

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', deletedUserData))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },

  restoreUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id as string)

      const userData = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'User not found'))
      }

      const deletedUserData = await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: null },
      })

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', deletedUserData))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },

  deleteUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id as string)

      const userData = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'User not found'))
      }
      

      await prisma.user.delete({
        where: { id: userId },
      })

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'DELETE', `delete user ${userData.name}`)

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success'))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
}

export default UserController
