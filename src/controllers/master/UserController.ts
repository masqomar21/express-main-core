import { StatusCodes } from 'http-status-codes'
import logger from '../../utilities/log'
import { Request, Response } from 'express'
import { ResponseData } from '../../utilities'
import { Pagination } from '../../utilities/pagination'
import prisma from '../../config/database'
import { z } from 'zod'
import { validateInput } from '../../utilities/ValidateHandler'

const UserController = {
  getAllUser : async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )

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

      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
        roleId: z.number(),
      })

      const validationResult = validateInput(schema, reqBody)

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
        data: schema.parse(reqBody),
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
}

export default UserController
