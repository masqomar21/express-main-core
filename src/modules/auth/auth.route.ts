import { Router } from 'express'
import AuthController from './auth.controller'

export const AuthRoute = () : Router => {
  const router = Router()

  router.post('/register', AuthController.register)
  router.post('/login', AuthController.login)
  router.delete('/logout', AuthController.logout)

  return router
}