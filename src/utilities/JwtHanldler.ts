import jwt from 'jsonwebtoken'
import logger from './Log'

export const generateAccesToken = function (
  payload: jwtPayloadInterface,
  secretToken: string,
  expiresIn: number,
): string {
  return jwt.sign(payload, secretToken, { expiresIn })
}

export const verifyAccesToken = function (
  token: string,
  secretToken: string,
): jwtPayloadInterface | null {
  try {
    const decoded = jwt.verify(token, secretToken)

    if (typeof decoded === 'object' && decoded !== null && 'id' in decoded) {
      return decoded as jwtPayloadInterface
    }

    return null
  } catch (error) {
    logger.error('Error verifying JWT token:', error)
    return null
  }
}
