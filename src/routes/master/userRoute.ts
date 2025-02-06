import { Router } from 'express'
import UserController from '../../controllers/master/UserController'

export const UserRouter = (): Router => {
  const router = Router()

  router.get('/', UserController.getAllUser)
  router.get('/:id', UserController.getUserById)
  router.post('/', UserController.createUser)
  router.put('/:id', UserController.updateUser)
  router.delete('/:id/soft', UserController.softDeleteUser)
  router.patch('/:id/restore', UserController.restoreUser)
  router.delete('/:id/hard', UserController.deleteUser)

  return router
}
