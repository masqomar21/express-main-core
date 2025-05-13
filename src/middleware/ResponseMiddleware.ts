import { Request, Response, NextFunction } from 'express'
import logger from '../utilities/Log'

const ResponseMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const start = new Date()

  res.on('finish', () => {
    const ms = new Date().getTime() - start.getTime()
    logger.info(
      `${req.method} ${req.originalUrl} [${res.statusCode}] - ${ms}ms`,
    )
  })

  next()
}

export { ResponseMiddleware }
