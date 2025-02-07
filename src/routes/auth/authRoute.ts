import { Router } from 'express'
import AuthController from '../../controllers/auth/AuthController'

export const AuthRoute = () : Router => {
  const router = Router()

  router.post('/register', AuthController.register)
  router.post('/login', AuthController.login)

  return router
}