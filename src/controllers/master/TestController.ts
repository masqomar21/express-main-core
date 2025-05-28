import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { deleteFileFromS3 } from '@/utilities/AwsHandler'
import { handleUpload } from '@/utilities/UploadHandler'

const TestController = {
  testFileUploadToS3: async (req : Request, res :Response) => {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json(ResponseData(StatusCodes.BAD_REQUEST, 'File not found'))
    }

    try {
      // Upload file ke S3
      const fileName = await handleUpload(req, 'file', 'test', undefined)

      console.log('fileName', req.file)

      return res.status(StatusCodes.OK).json(ResponseData(StatusCodes.OK, 'File uploaded successfully', fileName))
    } catch (error) {
      return serverErrorResponse(res, error)
    }
  },
  deleteFileFromS3: async (req : Request, res :Response) => {
    if (!req.body.fileUrl) {
      return res.status(StatusCodes.BAD_REQUEST).json(ResponseData(StatusCodes.BAD_REQUEST, 'File URL not found'))
    }

    try {
      const fileUrl = req.body.fileUrl
      await deleteFileFromS3(fileUrl)
      return res.status(StatusCodes.OK).json(ResponseData(StatusCodes.OK, 'File deleted successfully'))
    } catch (error) {
      return serverErrorResponse(res, error)
    }
  },
}

export default TestController