import { JwtPayloadInterface } from '../../core/jwt'

declare namespace Express {
  export interface Request {
    user?: JwtPayloadInterface
  }
}
