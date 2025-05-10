import { CONFIG } from '@/config'
import { fileUploadMiddleware } from '@/middleware/FileUploadMiddleware'
import { ResponseData } from '@/utilities'
import {
  type Express,
  type Request,
  type Response,
} from 'express'
import { StatusCodes } from 'http-status-codes'
import { AuthRoute } from './auth/AuthRoute'
import { UserRouter } from './master/UserRoute'
import TestController from '@/controllers/master/TestController'


const fileUpload = fileUploadMiddleware.fileUploadHandler('uploads', {
  maxFileSize: CONFIG.maxFileSize as number,
  allowwedFileTypes: /jpeg|jpg|png|pdf/,
  saveToBucket: CONFIG.saveToBucket,
})

export const appRouter = async function (app: Express): Promise<void> {
  app.get('/', (req: Request, res: Response) => {
    const data = {
      message: `Welcome to ${CONFIG.appName} for more function use ${CONFIG.apiUrl} as main router`,
    }
    const response = ResponseData(StatusCodes.OK, 'Success', data)
    return res.status(StatusCodes.OK).json(response)
  })

  // other route
  // auth route
  app.use(CONFIG.apiUrl + 'auth', AuthRoute())

  // master route
  app.use(CONFIG.apiUrl + 'master/user', UserRouter())

  app.post(CONFIG.apiUrl + 'test-up-file', fileUpload.single('images'), TestController.testFileUploadToS3)
}
