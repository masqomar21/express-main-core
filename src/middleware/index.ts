import { errorMiddleware, notFoundMiddleware } from "./globalErrMiddleware"
import { fileUploadMiddleware } from "./fileUploadMiddleware"
import { ResponseMiddleware } from "./responseMiddleware"

export const middleware = {
  errorMiddleware,
  notFoundMiddleware,
  fileUploadMiddleware,
  ResponseMiddleware,
}
