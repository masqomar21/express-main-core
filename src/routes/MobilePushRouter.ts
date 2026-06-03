import MobilePushNotifController from '@/controllers/notification/MobilePushNotifController'
import { Router } from 'express'

export const MobilePushNotifRouter = (): Router => {
  const router = Router()

  router.post('/subscribe', MobilePushNotifController.subscribe)
  router.post('/unsubscribe', MobilePushNotifController.unSubscribe)

  return router
}
