import { StatusCodes } from 'http-status-codes'
import logger from '../../utilities/log'
import { Request, Response } from 'express'
import { ResponseData } from '../../utilities'
import { Pagination } from '../../utilities/pagination'
import prisma from '../../config/database'
import { validateInput } from '../../utilities/ValidateHandler'
import { UserSchemaForCreate, UserSchemaForUpdate } from '../../Schema/UserSchema'
import { logActivity } from '../../utilities/logActivity'
import { jwtPayloadInterface } from '../../utilities/jwtHanldler'
import { getIO } from '../../config/socket'

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

      //loger crete user
      

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

      const userData = await prisma.user.create({
        data: UserSchemaForCreate.parse(reqBody),
      })

      // soket create user
      getIO().emit('create-user', userData)

      // loger create user wajib untuk setiap create 
      await logActivity(userLogin.id, 'create', `Create user ${userData.name}`)

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
        data: reqBody,
      })

      const userLogin = req.user as jwtPayloadInterface
      await logActivity(userLogin.id, 'update', `update user ${userData.name}`)

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', updatedUserData))
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
      await logActivity(userLogin.id, 'delete', `delete user ${userData.name}`)

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', deletedUserData))
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
      await logActivity(userLogin.id, 'delete', `delete user ${userData.name}`)

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
            'Internal server error' + error.message,
          ),
        )
    }
  },
}

export default UserController
