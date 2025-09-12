import { CONFIG } from '@/config'
import { fileUploadMiddleware } from '@/middleware/FileUploadMiddleware'
import {
  type Express,
  type Request,
  type Response,
} from 'express'
import { AuthRoute } from './auth/AuthRoute'
import { UserRouter } from './master/UserRoute'
import TestController from '@/controllers/master/TestController'
import { ResponseData } from '@/utilities/Response'
import { WebPushNotifRouter } from './WebPushRouter'
import { NotificationRouter } from './notification/NotificationRouter'
import { LogRouter } from './LogRouter'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { getBuildInfo } from '@/utilities/GetBuildInfo'
import { RoleRouter } from './master/RoleRouter'
import { generatePermissionList } from '@/middleware/PermissionMidlleware'


// const fileUpload = fileUploadMiddleware.fileUploadHandler('uploads', {
//   maxFileSize: CONFIG.maxFileSize as number,
//   allowedFileTypes : ['image/webp', 'image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/csv'],
//   // saveToBucket: CONFIG.saveToBucket,
// })


const fileUpload = fileUploadMiddleware.fileUploadHandler('uploads', {
  maxFileSize : 10 * 1024 * 1024, // 10MB
  allowedFileTypes : ['image/gif', 'image/jpeg','image/jpg', 'image/png', 'image/webp'],
  saveToBucket : true,
})

export const appRouter = async function (app: Express): Promise<void> {
  app.get('/', (req: Request, res: Response) => {
    const data = {
      buildInfo : getBuildInfo(),
      message: `Welcome to ${CONFIG.appName} for more function use ${CONFIG.apiUrl} as main router`,
    }
    return ResponseData.ok(res, data, 'Welcome to API')
  })

  app.post(CONFIG.apiUrl + 'test-up-file', fileUpload.single('gambar'), TestController.testFileUploadToS3)
  app.post(CONFIG.apiUrl + 'test-up-delete', fileUpload.single('images'), TestController.deleteFileFromS3)
  app.post(CONFIG.apiUrl + 'test-notif', TestController.testNotif)

  
  // auth route
  app.use(CONFIG.apiUrl + 'auth', AuthRoute())

  // product route
  app.use(AuthMiddleware, generatePermissionList)

  app.get(CONFIG.apiUrl + 'generate-permission', async (req: Request, res: Response) => {
    return ResponseData.ok(res, res.locals.permissionList, 'Success')
  })


  //web push
  app.use(CONFIG.apiUrl + 'web-push', WebPushNotifRouter())

  // notification route
  app.use(CONFIG.apiUrl + 'notification', NotificationRouter())

  // log route
  app.use(CONFIG.apiUrl + 'log', LogRouter())

  // master route
  app.use(CONFIG.apiUrl + 'master/user', UserRouter())
  app.use(CONFIG.apiUrl + 'master/role', RoleRouter())
}
