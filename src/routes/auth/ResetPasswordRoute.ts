import ResetPasswordController from '@/controllers/auth/ResetPassword'
import { Router } from 'express'

export const ResetPasswordRoute = (): Router => {
  const router = Router()

  router.post('/verify-email', ResetPasswordController.searchEmail)
  router.post('/verify-otp', ResetPasswordController.verifyOtp)
  router.put('/change-password', ResetPasswordController.resetPassword)

  return router
}
