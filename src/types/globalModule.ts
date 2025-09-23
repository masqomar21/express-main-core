
export class UploadError extends Error {
  public statusCode: number
  public type: ErrorFileUpload

  constructor(message: string, type: ErrorFileUpload = 'UPLOAD_ERROR', statusCode = 400) {
    super(message)
    this.name = 'UploadError'
    this.type = type
    this.statusCode = statusCode
  }
}