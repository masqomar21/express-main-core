import { Request, Response } from 'express'
import { validateInput } from '../../utilities/ValidateHandler'
import { UserSchemaForCreate } from '../../Schema/UserSchema'
import { StatusCodes } from 'http-status-codes'
import { ResponseData } from '../../utilities'
import prisma from '../../config/database'
import logger from '../../utilities/log'

const AuthController = {
  register : async (req: Request, res: Response) => {
    const reqBody = req.body
      
    const validationResult = validateInput(UserSchemaForCreate, reqBody)
      
    if (!validationResult.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(
          ResponseData(
            StatusCodes.BAD_REQUEST,
            'Invalid Input',
            validationResult.errors,
          ),
        )
    }
    try {

      const userData = await prisma.user.create({
        data: UserSchemaForCreate.parse(reqBody),
      })

      return res
        .status(StatusCodes.CREATED)
        .json(ResponseData(StatusCodes.CREATED, 'Success', userData))
    } catch (error: any) {
      logger.error(error)
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          ResponseData(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Internal server error' + error.message,
          ),
        )
    }
  },
}


export default AuthController