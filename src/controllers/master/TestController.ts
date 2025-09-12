import { Request, Response } from 'express'
import { deleteFileFromS3 } from '@/utilities/AwsHandler'
import { handleUpload } from '@/utilities/UploadHandler'
import { TemplateHtml } from '@/template/TestPrint'
import { PDFExportService } from '@/services/PdfPrintService'
import { ResponseData } from '@/utilities/Response'
import NotificationServices from '@/services/NotificationService'

const TestController = {
  testFileUploadToS3: async (req : Request, res :Response) => {

    // console.log(req)
    
    if (!req.file) {
      return ResponseData.badRequest(res, 'File not found in request')
    }

    // console.log('req.file', req.file)
    // console.log('req.file', req.files)

    try {
      // Upload file ke S3
      const fileName = await handleUpload(req, 'gambar', 'test', undefined)

      console.log('fileName', fileName)

      return ResponseData.ok(res, { fileName }, 'File uploaded successfully')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
  deleteFileFromS3: async (req : Request, res :Response) => {
    if (!req.body.fileUrl) {
      return ResponseData.badRequest(res, 'File URL not provided')
    }

    try {
      const fileUrl = req.body.fileUrl
      await deleteFileFromS3(fileUrl)
      return ResponseData.ok(res, null, 'File deleted successfully')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
  testPrintWithTemplate: async (req: Request, res: Response) => {
    try {
      const data = req.body

      const page =  TemplateHtml(data)

      const PDFService = new PDFExportService()
      const buffer = await PDFService.exportFormPageSourceToBuffer(page, {
        pageSize: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      })

      await PDFService.returnToResponseBuffer(res, buffer, 'test-print.pdf')

    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  testNotif: async (req: Request, res: Response) => {

    const data = {
      message : req.body.message || '⚡ “Stay focused, stay awesome!”',
      userId : req.body.userId || [1],
      title : req.body.title || 'Our Loved Developer ❤️',

    }
    try {

      await NotificationServices.sendNotification([...data.userId], {
        message : data.message,
        type : 'messageFormDeveloper',
        // refId : 12345,
        title: data.title,
      })
      return ResponseData.ok(res, {}, 'Notifikasi test endpoint')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default TestController