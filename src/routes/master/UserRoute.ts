import UserController from '@/controllers/master/UserController'
import { permissionMiddleware } from '@/middleware/PermissionMidlleware'
import { Router } from 'express'

export const UserRouter = (): Router => {
  const router = Router()

  router.get('/', permissionMiddleware('User_Management', 'canRead'), UserController.getAllUser)
  router.get('/:id', permissionMiddleware('User_Management', 'canRead'), UserController.getUserById)
  router.post('/', permissionMiddleware('User_Management', 'canWrite'), UserController.createUser)
  router.put('/:id', permissionMiddleware('User_Management', 'canUpdate'), UserController.updateUser)
  router.delete('/:id/soft', permissionMiddleware('User_Management', 'canDelete'), UserController.softDeleteUser)
  router.patch('/:id/restore', permissionMiddleware('User_Management', 'canRestore'), UserController.restoreUser)
  router.delete('/:id/hard', permissionMiddleware('User_Management', 'canDelete'), UserController.deleteUser)

  return router
}
