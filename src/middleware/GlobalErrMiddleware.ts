import { Request, Response, NextFunction } from 'express'

import { StatusCodes } from 'http-status-codes'
import logger from '../utilities/Log'
import { ResponseData } from '@/utilities/Response'

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

  return ResponseData.serverError(
    res,
    err.message || 'Internal Server Error',
    err.status || StatusCodes.INTERNAL_SERVER_ERROR,
  )
}

export const notFoundMiddleware = (req: Request, res: Response) => {
  return ResponseData.notFound(res, 'URL not found - 404 Not Found')
}
