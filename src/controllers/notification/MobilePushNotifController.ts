import prisma from '@/config/database'

import { ResponseData } from '@/utilities/Response'
import { validateInput } from '@/utilities/ValidateHandler'
import { Request, Response } from 'express'
import z from 'zod'

const schema = z.object({
  token: z.string().min(1, 'token harus diisi'),
})

const MobilePushNotifController = {
  async subscribe(req: Request, res: Response) {
    const userLogin = req.user as jwtPayloadInterface

    const validateResult = validateInput(schema, req.body)
    if (!validateResult.success) {
      return ResponseData.badRequest(res, undefined, validateResult.errors)
    }

    const reqBody = validateResult.data!
    try {
      await prisma.mobilPushSubscription.upsert({
        where: { token: reqBody.token },
        create: {
          userId: userLogin.id,
          token: reqBody.token,
        },
        update: {},
      })

      return ResponseData.ok(res, {}, 'success upsert subcribe')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async unSubscribe(req: Request, res: Response) {
    const schema = z.object({
      token: z.string().min(1, 'token harus diisi'),
    })

    const validateResult = validateInput(schema, req.body)
    if (!validateResult.success) {
      return ResponseData.badRequest(res, undefined, validateResult.errors)
    }
    try {
      await prisma.mobilPushSubscription.delete({
        where: { token: validateResult.data!.token },
      })
      return ResponseData.ok(res, {}, 'success unSubcribe')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default MobilePushNotifController
