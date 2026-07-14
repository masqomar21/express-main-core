import { Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import logger from './Log'
import { CONFIG } from '@/config'
import { UploadError } from '@/types/globalModule'
import { SanitizeOptions, sanitizeResponse } from './ResponseSanitizer'

export const ResponseData = {
  /**
   * Response 200 OK (with sanitization)
   * @param res - Express response object
   * @param data - Data to be sent in the response
   * @param message - Optional message for the response
   * @param sanitizeOpts - Optional sanitization options
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  ok: <T>(
    res: Response,
    data: T,
    message = 'Success',
    sanitizeOpts?: SanitizeOptions,
  ): Response => {
    const sanitizedData = sanitizeResponse(data, { deep: true, ...sanitizeOpts })
    return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message, data: sanitizedData })
  },

  /**
   * Response 201 Created (with sanitization)
   * @param res - Express response object
   * @param data - Data to be sent in the response
   * @param message - Optional message for the response
   * @param sanitizeOpts - Optional sanitization options
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  created: <T>(
    res: Response,
    data: T,
    message = 'Resource created',
    sanitizeOpts?: SanitizeOptions,
  ): Response => {
    const sanitizedData = sanitizeResponse(data, { deep: true, ...sanitizeOpts })
    return res
      .status(StatusCodes.CREATED)
      .json({ status: StatusCodes.CREATED, message, data: sanitizedData })
  },

  /**
   * Response 400 Bad Request
   * @param res - Express response object
   * @param message - Optional message for the response
   * @param data - Optional data to be sent in the response
   * @return {Response} - Express response object with JSON data
   */
  badRequest: (res: Response, message = 'Bad request', data: any = null): Response =>
    res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message, data }),

  /**
   * Response 400 Bad Request (Validation Error)
   * @param res - Express response object
   * @param data - Validation error data
   * @return {Response} - Express response object with JSON data
   */
  validateError: (res: Response, data: any = null): Response =>
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ status: StatusCodes.BAD_REQUEST, message: 'Bad request', data }),

  /**
   * Response 401 Unauthorized
   * @param res - Express response object
   * @param message - Optional message for the response
   * @return {Response} - Express response object with JSON data
   */
  unauthorized: (res: Response, message = 'Unauthorized'): Response =>
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ status: StatusCodes.UNAUTHORIZED, message, data: null }),

  /**
   * Response 403 Forbidden
   * @param res - Express response object
   * @param message - Optional message for the response
   * @return {Response} - Express response object with JSON data
   */
  forbidden: (res: Response, message = 'Forbidden'): Response =>
    res.status(StatusCodes.FORBIDDEN).json({ status: StatusCodes.FORBIDDEN, message, data: null }),

  /**
   * Response 404 Not Found
   * @param res - Express response object
   * @param message - Optional message for the response
   * @return {Response} - Express response object with JSON data
   */
  notFound: (res: Response, message = 'Data not found'): Response =>
    res.status(StatusCodes.NOT_FOUND).json({ status: StatusCodes.NOT_FOUND, message, data: null }),

  /**
   * Response 500 Internal Server Error
   * @param res - Express response object
   * @param error - Error object to log
   * @param message - Optional message for the response
   * @return {Response} - Express response object with JSON data
   */
  serverError: (res: Response, error: any, message = 'Internal server error'): Response => {
    logger.error('Internal server error:', error)

    if (error instanceof UploadError && error.type !== 'UPLOAD_ERROR') {
      return ResponseData.badRequest(res, error.message)
    }

    const errorMessage =
      CONFIG.appMode === 'development' ? error?.message || 'Unexpected error' : null

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message,
      error: errorMessage,
      data: null,
    })
  },

  /**
   * Custom response with sanitization
   * @param res - Express response object
   * @param status - HTTP status code
   * @param message - Response message
   * @param data - Response data (will be sanitized)
   * @param sanitizeOpts - Optional sanitization options
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  otherResponse: <T>(
    res: Response,
    status: number,
    message: string,
    data?: T,
    sanitizeOpts?: SanitizeOptions,
  ): Response => {
    const sanitizedData = data ? sanitizeResponse(data, { deep: true, ...sanitizeOpts }) : null
    return res.status(status).json({
      status,
      message,
      data: sanitizedData || null,
    })
  },

  /**
   * Response without sanitization (for non-sensitive data)
   * Use this only when you're certain the data doesn't contain sensitive information
   * @param res - Express response object
   * @param data - Data to be sent without sanitization
   * @param message - Optional message for the response
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  okRaw: <T>(res: Response, data: T, message = 'Success'): Response =>
    res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message, data }),

  /**
   * Response 201 Created without sanitization
   * Use this only when you're certain the data doesn't contain sensitive information
   * @param res - Express response object
   * @param data - Data to be sent without sanitization
   * @param message - Optional message for the response
   * @return {Response} - Express response object with JSON data
   * @template T - Type of the data being returned
   */
  createdRaw: <T>(res: Response, data: T, message = 'Resource created'): Response =>
    res.status(StatusCodes.CREATED).json({ status: StatusCodes.CREATED, message, data }),
}

export default ResponseData
