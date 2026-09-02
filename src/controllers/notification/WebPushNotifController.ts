import db from '@/config/database'
import { WebPushSubscriptionSchema } from '@/schema/WebPushNotifSchema'

import { ResponseData } from '@/utilities/Response'
import { validateInput } from '@/utilities/ValidateHandler'
import { Request, Response } from 'express'
import z from 'zod'

const WebPushNotifController = {
  async subscribe(req: Request, res: Response) {
    const userLogin = req.user as jwtPayloadInterface

    const validateResult = validateInput(WebPushSubscriptionSchema, req.body)
    if (!validateResult.success) {
      return ResponseData.badRequest(res, undefined, validateResult.errors)
    }

    const reqBody = validateResult.data!
    try {
      const existing = await db.orm.public.WebPushSubscription.where({
        endpoint: reqBody.endpoint,
      }).first()

      if (existing) {
        await db.orm.public.WebPushSubscription.where({
          endpoint: reqBody.endpoint,
        }).update({
          p256dh: reqBody.keys.p256dh,
          auth: reqBody.keys.auth,
          expirationTime: reqBody.expirationTime ? new Date(reqBody.expirationTime) : null,
          userAgent: reqBody.userAgent ?? null,
        })
      } else {
        await db.orm.public.WebPushSubscription.create({
          userId: userLogin.id,
          endpoint: reqBody.endpoint,
          p256dh: reqBody.keys.p256dh,
          auth: reqBody.keys.auth,
          expirationTime: reqBody.expirationTime ? new Date(reqBody.expirationTime) : null,
          userAgent: reqBody.userAgent ?? null,
        })
      }

      return ResponseData.ok(res, {}, 'success upsert subcribe')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async unSubscribe(req: Request, res: Response) {
    const schema = z.object({
      endpoint: z.string().url('endpoint harus URL valid').max(2048),
    })

    const validateResult = validateInput(schema, req.body)
    if (!validateResult.success) {
      return ResponseData.badRequest(res, undefined, validateResult.errors)
    }
    try {
      await db.orm.public.WebPushSubscription.where({
        endpoint: validateResult.data!.endpoint,
      }).delete()
      return ResponseData.ok(res, {}, 'success unSubcribe')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default WebPushNotifController
