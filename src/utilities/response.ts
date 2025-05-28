import logger from './log'

interface ResponseDataAttributes<T> {
  status: number;
  message: string | null;
  error?: string | null;
  data?: T;
}

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

export function serverErrorResponse(error: any): ResponseDataAttributes<null> {
  logger.error('Internal server error: ', error)
  return {
    status: 500,
    message: 'Internal server error',
    error: error.message || 'An unexpected error occurred',
    data: null,
  }
}