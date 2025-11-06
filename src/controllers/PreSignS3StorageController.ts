import { ResponseData } from '@/utilities/Response'
import { deleteFileFromS3, generateUploadUrl } from '@/utilities/S3Handler'
import { validateInput } from '@/utilities/ValidateHandler'
import { Request, Response } from 'express'
import z from 'zod'

const PreSignS3StorageController = {
  async generateUploadUrl(req: Request, res: Response) {
    const schema = z.object({
      fileName: z.string(),
      fileType: z.string(),
      folderPath: z.string().optional(),
    })

    const validateResult = validateInput(schema, req.query)
    if (!validateResult.success) {
      return ResponseData.validateError(res, validateResult.errors)
    }
    const { fileName, fileType, folderPath } = validateResult.data!
    try {
      const { signedUrl, fileUrl } = await generateUploadUrl(fileName, fileType, folderPath)
      return ResponseData.ok(res, { signedUrl, fileUrl })
    } catch (error) {
      console.log(error)
      return ResponseData.serverError(res, error)
    }
  },

  async deleteFile(req: Request, res: Response) {
    const { fileUrl } = req.query

    if (!fileUrl || typeof fileUrl !== 'string') {
      return ResponseData.badRequest(res, 'fileUrl is required')
    }
    try {
      await deleteFileFromS3(fileUrl)
      return ResponseData.ok(res, {})
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default PreSignS3StorageController
