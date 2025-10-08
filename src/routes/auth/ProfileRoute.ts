import ProfileController from '@/controllers/auth/ProfileController'
import { Router } from 'express'
// import { fileUploadMiddleware } from '@/middleware/FileUploadMiddleware'

// const fileUpMidd = fileUploadMiddleware.fileUploadHandler('profile', {
//   allowedFileTypes: [
//     'image/jpeg',
//     'image/webp',
//     'image/webp',
//     'image/gif',
//     'image/jpg',
//     'image/png',
//   ],
//   maxFileSize: 5 * 1024 * 1024, // 5 MB
//   saveToBucket: true,
// })

export const ProfileRoute = (): Router => {
  const router = Router()

  router.put('/change-password', ProfileController.changePassword)
  router.put('/update', ProfileController.updateUser)

  return router
}
