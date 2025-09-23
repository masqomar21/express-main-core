import { Request, Response, NextFunction } from 'express'

import { StatusCodes } from 'http-status-codes'
import logger from '../utilities/Log'
import { ResponseData } from '@/utilities/Response'
import { MulterError } from 'multer'
import { UploadError } from '@/types/globalModule'

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof MulterError) {
    let errMsg = err.message
    switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      errMsg = 'File terlalu besar'
      break
    case 'LIMIT_FILE_COUNT':
      errMsg = 'Jumlah file melebihi batas'
      break
    case 'LIMIT_UNEXPECTED_FILE':
      errMsg = 'Tipe file tidak sesuai, atau jumlah file melebihi batas'
      break
    default:
      break
    }
    return ResponseData.badRequest(res, errMsg)
  }
  if (err instanceof UploadError && err.type !== 'UPLOAD_ERROR') {
    return ResponseData.badRequest(res, err.message)
  }
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
