import RoleController from '@/controllers/master/RoleController'
import { Router } from 'express'

export const RoleRouter = () : Router => {
  const router = Router()

  router.get('/permissions', RoleController.getAllPermission)
  router.get('/', RoleController.getAllRole)
  router.get('/:roleId', RoleController.getRoleById)
  router.post('/', RoleController.createRole)
  router.put('/:roleId', RoleController.updateRole)
  router.delete('/:roleId', RoleController.deleteRole)


  return router
}