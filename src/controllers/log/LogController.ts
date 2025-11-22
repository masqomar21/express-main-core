import prisma from '@/config/database'
import { Pagination } from '@/utilities/Pagination'
import { ResponseData } from '@/utilities/Response'
import { Request, Response } from 'express'
import { Prisma } from 'generated/prisma/client'

const LogController = {
  async getUserLog(req: Request, res: Response) {
    const userLogin = req.user as jwtPayloadInterface
    const paginate = new Pagination(Number(req.query.page) || 1, Number(req.query.limit) || 10)
    try {
      const whereCondition: Prisma.LogerWhereInput = {
        userId: userLogin.id,
      }

      const [data, count] = await Promise.all([
        prisma.loger.findMany({
          where: whereCondition,
          skip: paginate.offset,
          take: paginate.limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.loger.count({
          where: whereCondition,
        }),
      ])

      return ResponseData.ok(res, paginate.paginate(count, data), 'User log retrieved successfully')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async getLogByUserId(req: Request, res: Response) {
    const userId = req.params.id

    if (!userId || isNaN(Number(userId))) {
      return ResponseData.badRequest(res, 'User ID is required and must be a number')
    }

    const paginate = new Pagination(Number(req.query.page) || 1, Number(req.query.limit) || 10)
    try {
      const whereCondition: Prisma.LogerWhereInput = {
        userId: Number(userId),
      }

      const [data, count] = await Promise.all([
        prisma.loger.findMany({
          where: whereCondition,
          skip: paginate.offset,
          take: paginate.limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.loger.count({
          where: whereCondition,
        }),
      ])

      return ResponseData.ok(res, paginate.paginate(count, data), 'User log retrieved successfully')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async getAllLog(req: Request, res: Response) {
    const paginate = new Pagination(Number(req.query.page) || 1, Number(req.query.limit) || 10)
    try {
      const [data, count] = await Promise.all([
        prisma.loger.findMany({
          skip: paginate.offset,
          take: paginate.limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.loger.count(),
      ])

      return ResponseData.ok(res, paginate.paginate(count, data), 'All logs retrieved successfully')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default LogController
