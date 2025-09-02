import NotificationController from '@/controllers/notification/NotificationController'
import { Router } from 'express'

export const NotificationRouter = () : Router => {
  const router = Router()

  router.get('/', NotificationController.getAllnotif)
  router.get('/unread', NotificationController.unReadNotif)

  router.patch('/:notificationId/read', NotificationController.readNotif)
  router.patch('/read-all', NotificationController.readAllNotif)
  router.delete('/delete-all', NotificationController.deleteAllNotif)

  return router
}