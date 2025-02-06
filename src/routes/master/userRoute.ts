import { Router } from 'express'
import UserController from '../../controllers/master/UserController'

export const UserRouter = (): Router => {
  const router = Router()

  router.get('/', UserController.getAllUser)
  router.get('/:id', UserController.getUserById)
  router.post('/', UserController.createUser)

  return router
}
