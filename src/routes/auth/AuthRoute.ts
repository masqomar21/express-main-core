import AuthController from '@/controllers/auth/AuthController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'


export const AuthRoute = () : Router => {
  const router = Router()

  router.post('/register', AuthController.register)
  router.post('/login', AuthController.login)
  router.delete('/logout',AuthMiddleware, AuthController.logout)

  return router
}