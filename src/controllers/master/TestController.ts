import { Request, Response } from 'express'
import { deleteFileFromS3 } from '@/utilities/S3Handler'
import { handleUpload } from '@/utilities/UploadHandler'
import { TemplateHtml } from '@/template/TestPrint'
import { PDFExportService } from '@/services/PdfPrintService'
import { ResponseData } from '@/utilities/Response'
import NotificationServices from '@/services/NotificationService'
import { createTemplateFile } from '@/services/google/PdfGeneratorSevice'
import { extractIndexFromFieldname } from '@/utilities/ValidateHandler'

const TestController = {
  testFileUploadToS3: async (req: Request, res: Response) => {
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
  deleteFileFromS3: async (req: Request, res: Response) => {
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

      const page = TemplateHtml(data)

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
      message: req.body.message || '⚡ “Stay focused, stay awesome!”',
      userId: req.body.userId || [1],
      title: req.body.title || 'Our Loved Developer ❤️',
    }
    try {
      await NotificationServices.sendNotification([...data.userId], {
        message: data.message,
        type: 'messageFormDeveloper',
        // refId : 12345,
        title: data.title,
      })
      return ResponseData.ok(res, {}, 'Notifikasi test endpoint')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async testGenerateGoogleTemplate(req: Request, res: Response) {
    try {
      const template = await createTemplateFile({
        title: 'Template Surat Keterangan - Newus',
        initialText: `
    SURAT KETERANGAN

    Yang bertanda tangan di bawah ini menyatakan bahwa:

    Nama: {{nama}}
    Alamat: {{alamat}}
    Jabatan: {{jabatan}}

    Demikian surat ini dibuat untuk digunakan sebagaimana mestinya.
  `,
        folderId: '17jsOjuw4k8efqIgVlXOSIRUL9HrKrpKc',
      })

      console.log('Template baru:', template)

      return ResponseData.ok(res, template, 'Template Google Docs berhasil dibuat')
    } catch (error) {
      // console.error('Gagal membuat template:', error)
      return ResponseData.serverError(res, error)
    }
  },

  async testMultyArrarFileUplad(req: Request, res: Response) {
    const file = req.files as Express.Multer.File[] | undefined
    if (!file || file.length === 0) {
      return ResponseData.badRequest(res, 'File not found in request')
    }
    try {
      const data = []
      if (file && file.length > 0) {
        for (const f of file) {
          const index = extractIndexFromFieldname(f.fieldname, 'member', 'ktp')
          if (index === null || index < 0) continue
          // Simpan file ke S3
          const fileName = await handleUpload(req, f.fieldname, 'poktanDoc', [
            'image/jpeg',
            'image/png',
          ])
          data[index] = {
            ktp: fileName,
          }
        }
      }
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default TestController
