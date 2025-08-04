import { Response } from 'express'
import logger from './Log'
import { StatusCodes } from 'http-status-codes'
import { CONFIG } from '@/config'



export const ResponseData = {
  /**
   * Response 200 OK
   * @param res - Express response object
   * @param data - Data to be sent in the response
   * @param message - Optional message for the response
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  ok: <T>(res: Response, data: T, message = 'Success'): Response =>
    res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message, data }),

  /**
   * Response 201 Created
   * @param res - Express response object
   * @param data - Data to be sent in the response
   * @param message - Optional message for the response
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  created: <T>(res: Response, data: T, message = 'Resource created'): Response =>
    res.status(StatusCodes.CREATED).json({ status: StatusCodes.CREATED, message, data }),

  /**
   * Response 400 Bad Request
   * @param res - Express response object
   * @param message - Optional message for the response
   * @param data - Optional data to be sent in the response
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  badRequest: (res: Response, message = 'Bad request', data: any = null): Response =>
    res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message, data }),

  /**
   * Response 401 Unauthorized
   * @param res - Express response object
   * @param message - Optional message for the response
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  unauthorized: (res: Response, message = 'Unauthorized'): Response =>
    res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, message, data: null }),

  forbidden: (res: Response, message = 'Forbidden'): Response =>
    res.status(StatusCodes.FORBIDDEN).json({ status: StatusCodes.FORBIDDEN, message, data: null }),
  /**
   * Response 404 Not Found
   */
  notFound: (res: Response, message = 'Data not found'): Response =>
    res.status(StatusCodes.NOT_FOUND).json({ status: StatusCodes.NOT_FOUND, message, data: null }),

  /**
   * Response 500 Internal Server Error (plus logger)
   * @param res - Express response object
   * @param error - Error object to log
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  serverError: (res: Response, error: any, message = 'Internal server error'): Response => {
    logger.error('Internal server error:', error)

    const errorMessage = CONFIG.appMode === 'development'
      ? error?.message || 'Unexpected error'
      : null

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message,
      error: errorMessage,
      data: null,
    })
  },

  /**
   * Response 500 Internal Server Error
   * @param res - Express response object
   * @param error - Error object to log
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  otherResponse: <T>(res: Response, status: number, message: string, data?: T): Response =>{
    return res.status(status).json({
      status,
      message,
      data: data || null,
    })
  },
}
