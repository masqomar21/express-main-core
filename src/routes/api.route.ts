import {
  type Express,
  type Request,
  type Response,
} from 'express'
import { ResponseData } from '../utilities'
import { StatusCodes } from 'http-status-codes'
import { CONFIG } from '../config'
import { UserRouter } from './master/userRoute'
import { AuthRoute } from './auth/authRoute'

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
}
