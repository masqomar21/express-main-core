import LogController from '@/controllers/log/LogController'
import { Router } from 'express'

export const LogRouter = () : Router => {
  const router = Router()

  router.get('/', LogController.getAllLog)
  router.get('/user', LogController.getUserLog)
  router.get('/:id', LogController.getLogByUserId)

  return router
}