import jwt from 'jsonwebtoken'
import logger from './Log'
import { v4 as uuidv4 } from 'uuid'

export const generateAccesToken = function<T> (
  payload: T,
  secretToken: string,
  expiresIn: number,
): { token: string, jti: string } {
  // Generate unique JWT ID (jti) for token revocation tracking
  const tokenPayload = {
    ...payload,
    jti: uuidv4(), // Add unique identifier for this token
  }
  return { token: jwt.sign(tokenPayload, secretToken, { expiresIn }), jti: tokenPayload.jti }
}

export const verifyAccesToken = function<T> (
  token: string,
  secretToken: string,
):  T | null {
  try {
    const decoded = jwt.verify(token, secretToken)

    if (typeof decoded === 'object' && decoded !== null && 'id' in decoded) {
      return decoded as T
    }

    return null
  } catch (error) {
    logger.error('Error verifying JWT token:', error)
    return null
  }
}
