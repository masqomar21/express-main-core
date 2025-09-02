import prisma from '@/config/database'
import NotificationServices, { NotificationKind } from '@/services/NotificationService'
import { Pagination } from '@/utilities/Pagination'
import { ResponseData } from '@/utilities/Response'
import { Request, Response } from 'express'

const NotificationController = {
  async getAllnotif(req: Request, res : Response) {

    const { readStatus, type, search, since } = req.query

    const notificationKind = new Set<NotificationKind>(['admin','messageFormDeveloper','other','user',
    ])

    if (typeof type === 'string' && !notificationKind.has(type as NotificationKind)) {
      return ResponseData.badRequest(res, 'Invalid notification type must be in ' + Array.from(notificationKind).join(', '))
    }

    const paginate = new Pagination(
      Number(req.query.page) || 1,
      Number(req.query.limit) || 10,
    )
    const userLogin = req.user as jwtPayloadInterface
    try {

      const data = await NotificationServices.getNotifications(
        userLogin.id,
        {
          limit : paginate.limit,
          offset : paginate.offset,
        },
        {
          readStatus: readStatus ? (readStatus === 'true') : undefined,
          type: type as NotificationKind,
          search: search as any,
          since: since ? new Date(since as any) : undefined,
        },
      )

      return ResponseData.ok(res, paginate.paginate({ count : data.total, rows : data.data }), 'success')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  }, 

  async unReadNotif(req: Request, res: Response) {
    const userLogin = req.user as jwtPayloadInterface
    try {
      const data = await NotificationServices.getNotifications(
        userLogin.id,
        {
          limit: 10,
          offset: 0,
        },
        {
          readStatus: false,
        },
      )

      return ResponseData.ok(res, {
        totalUnRead: data.total,
      }, 'success')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async readNotif(req: Request, res: Response) {
    const userLogin = req.user as jwtPayloadInterface
    const { notificationId } = req.params
    if (!notificationId || isNaN(Number(notificationId))) {
      return ResponseData.badRequest(res, 'Notification ID is required')
    }
    try {

      const cek = await prisma.notification.findUnique({
        where: {
          id: Number(notificationId),
        },
      })

      if (!cek) {
        return ResponseData.notFound(res, 'Notification not found')
      }
      await NotificationServices.readNotification(
        userLogin.id,
        Number(notificationId),
      )

      return ResponseData.ok(res, {}, 'success')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async readAllNotif(req: Request, res: Response) {
    const userLogin = req.user as jwtPayloadInterface
    try {
      await NotificationServices.readAllNotifications(userLogin.id)
      return ResponseData.ok(res, {}, 'success')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },


  async deleteAllNotif(req: Request, res: Response) {
    const userLogin = req.user as jwtPayloadInterface
    try {

      await NotificationServices.deleteAllNotifications(
        userLogin.id,
      )

      return ResponseData.ok(res, {}, 'success')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

}

export default NotificationController
