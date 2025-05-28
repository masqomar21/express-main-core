import { Request, Response, NextFunction } from 'express'
import { ResponseData } from '../utilities'
import { StatusCodes } from 'http-status-codes'
import logger from '../utilities/Log'

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`,
  )
  if (err.headersSent) {
    return next(err)
  }

  const response = ResponseData(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'Internal server error' + err.message,
  )

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response)
}

export const notFoundMiddleware = (req: Request, res: Response) => {
  return res.status(StatusCodes.NOT_FOUND).json(ResponseData(StatusCodes.NOT_FOUND, 'Not found'))
}
