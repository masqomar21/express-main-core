import db from '@/config/database'
import { Pagination } from '@/utilities/Pagination'
import { ResponseData } from '@/utilities/Response'
import { Request, Response } from 'express'

const LogController = {
  async getUserLog(req: Request, res: Response) {
    const userLogin = req.user as jwtPayloadInterface
    const paginate = new Pagination(req.query)
    try {
      const [data, count] = await Promise.all([
        db.orm.public.Loger.where({ userId: userLogin.id })
          .orderBy((l) => l.createdAt.desc())
          .offset(paginate.offset)
          .limit(paginate.limit)
          .all(),
        db.orm.public.Loger.where({ userId: userLogin.id }).count(),
      ])

      return ResponseData.ok(res, paginate.paginate(Number(count), data), 'User log retrieved successfully')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async getLogByUserId(req: Request, res: Response) {
    const userId = req.params.id

    if (!userId || isNaN(Number(userId))) {
      return ResponseData.badRequest(res, 'User ID is required and must be a number')
    }

    const paginate = new Pagination(req.query)
    try {
      const targetUserId = Number(userId)
      const [data, count] = await Promise.all([
        db.orm.public.Loger.where({ userId: targetUserId })
          .orderBy((l) => l.createdAt.desc())
          .offset(paginate.offset)
          .limit(paginate.limit)
          .all(),
        db.orm.public.Loger.where({ userId: targetUserId }).count(),
      ])

      return ResponseData.ok(res, paginate.paginate(Number(count), data), 'User log retrieved successfully')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async getAllLog(req: Request, res: Response) {
    const paginate = new Pagination(req.query)
    try {
      const [data, count] = await Promise.all([
        db.orm.public.Loger.orderBy((l) => l.createdAt.desc())
          .offset(paginate.offset)
          .limit(paginate.limit)
          .all(),
        db.orm.public.Loger.count(),
      ])

      return ResponseData.ok(res, paginate.paginate(Number(count), data), 'All logs retrieved successfully')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default LogController
