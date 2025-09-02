
import WebPushNotifController from '@/controllers/notification/WebPushNotifController'
import { Router } from 'express'

export const WebPushNotifRouter = () : Router=> {
  const router = Router()

  router.post('/subscribe', WebPushNotifController.subscribe)
  router.post('/unsubscribe', WebPushNotifController.unSubscribe)

  return router
}