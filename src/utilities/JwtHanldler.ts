import jwt from 'jsonwebtoken'
import logger from './Log'
import { v4 as uuidv4 } from 'uuid'

export const generateAccesToken = function (
  payload: jwtPayloadInterface,
  secretToken: string,
  expiresIn: number,
): string {
  // Generate unique JWT ID (jti) for token revocation tracking
  const tokenPayload = {
    ...payload,
    jti: uuidv4(), // Add unique identifier for this token
  }
  return jwt.sign(tokenPayload, secretToken, { expiresIn })
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
