import { Response } from 'express'
import logger from './Log'
import { StatusCodes } from 'http-status-codes'
import { CONFIG } from '@/config'

interface ResponseDataAttributes<T> {
  status: number;
  message: string | null;
  error?: string | null;
  data?: T;
}

/**
 * Generates a standardized response object for successful operations.
 * @param status - The HTTP status code.
 * @param message - A message describing the response.
 * @param data - Optional data to include in the response.
 * @returns A standardized response object.
 */
export function ResponseData<T>(
  status: number,
  message: string | null,
  data?: T,
): ResponseDataAttributes<T> {
  return {
    status,
    message,
    data,
  }
}

/**
 * Generates a standardized error response for internal server errors.
 * @param error - The error object to log and include in the response.
 * @returns A standardized error response object.
 */
export function errorServerResponseData(error: any): ResponseDataAttributes<null> {
  logger.error('Internal server error: ', error)
  return {
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    error: CONFIG.appMode === 'development' ? error.message || 'An unexpected error occurred' : null,
    data: null,
  }
}

/**
 * Sends a server error response with a standardized error message.
 * @param res - The Express response object.
 * @param error - The error object to log and include in the response.
 * @returns A JSON response with status 500 and error details.
 */
export function serverErrorResponse(res: Response, error: any): Response {
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
    errorServerResponseData(error),
  )
}