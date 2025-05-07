import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import fs from 'fs'
import { ResponseData } from '../../core/response'
import { FileType, uploadFileToS3WithOutRedis } from '../../utils/aws'

const TestController = {
  testFileUploadToS3: async (req : Request, res :Response) => {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json(ResponseData(StatusCodes.BAD_REQUEST, 'File not found'))
    }
    

    try {
      let fileBuffer: Buffer | string
      if (req.file.buffer) {
        fileBuffer = req.file.buffer
      } else if (req.file.path) {
        fileBuffer = fs.readFileSync(req.file.path)
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseData(StatusCodes.BAD_REQUEST, 'Invalid file data'),
        )
      }

      const fileUpload : FileType = {
        mimetype: req.file.mimetype,
        buffer: fileBuffer,
        originalname: req.file.originalname,
      }

      // Upload file ke S3
      const fileName = await uploadFileToS3WithOutRedis(fileUpload, 'test')

      console.log('fileName', req.file)

      if (fileName) {
        if (req.file.path) {
          fs.unlinkSync(req.file.path)
          console.log('file deleted')
        }
      }

      return res.status(StatusCodes.OK).json(ResponseData(StatusCodes.OK, 'File uploaded successfully', fileName))
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ResponseData(StatusCodes.INTERNAL_SERVER_ERROR, 'Internal server error'))
        
    }
  },
}

export default TestController