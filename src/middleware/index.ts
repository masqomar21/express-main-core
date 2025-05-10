import { errorMiddleware, notFoundMiddleware } from './GlobalErrMiddleware'
import { fileUploadMiddleware } from './FileUploadMiddleware'
import { ResponseMiddleware } from './ResponseMiddleware'

export const middleware = {
  errorMiddleware,
  notFoundMiddleware,
  fileUploadMiddleware,
  ResponseMiddleware,
}
