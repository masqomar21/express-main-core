import PreSignS3StorageController from '@/controllers/S3UtilsController'
import { Router } from 'express'

export const S3UtilsRoute = (): Router => {
  const router = Router()

  router.get('/generate-pre-sign-url', PreSignS3StorageController.generateUploadUrl)
  router.delete('/delete-file', PreSignS3StorageController.deleteFile)

  return router
}
