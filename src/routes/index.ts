import {
  type Express,
  type Request,
  type Response,
} from 'express'
import { StatusCodes } from 'http-status-codes'
import { fileUploadMiddleware } from '../middlewares/fileUploadMiddleware'
import { CONFIG } from '../config'
import { ResponseData } from '../core/response'
import { AuthRoute } from '../modules/auth/auth.route'
import { UserRouter } from '../modules/user/user.route'
import TestController from '../modules/user/test.controller'

const fileUpload = fileUploadMiddleware.fileUploadHandler('uploads', 5 * 1024 * 1024) // 5MB

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
