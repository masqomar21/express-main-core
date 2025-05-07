import jwt, { JwtPayload } from 'jsonwebtoken'

export interface JwtPayloadInterface extends JwtPayload {
  id: number;
  name: string;
  role?: string;
  user?: string;
}

export const generateAccessToken = (
  payload: JwtPayloadInterface,
  secretToken: string,
  expiresIn: number,
): string => {
  return jwt.sign(payload, secretToken, { expiresIn })
}

export const verifyAccessToken = (
  token: string,
  secretToken: string,
): JwtPayloadInterface | null => {
  try {
    const decoded = jwt.verify(token, secretToken)
    if (typeof decoded === 'object' && decoded !== null && 'id' in decoded) {
      return decoded as JwtPayloadInterface
    }
    return null
  } catch (error) {
    return null
  }
}