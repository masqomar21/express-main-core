import { Request, Response } from 'express'
import { ExcelExportService } from '@/services/ExcelExportService'
import { PDFExportService } from '@/services/PdfPrintService'
import { ResponseData } from '@/utilities/Response'

type ProviderEarlyResponse = Response

type PrintTableDataProvider = (
  req: Request,
  res: Response,
) =>
  | Promise<PrintTableResponse | ProviderEarlyResponse>
  | PrintTableResponse
  | ProviderEarlyResponse

const getRawFormatQuery = (req: Request): string | undefined => {
  const { format, fileType, type } = req.query
  const candidate = format ?? fileType ?? type

  if (Array.isArray(candidate)) {
    return typeof candidate[0] === 'string' ? candidate[0] : undefined
  }

  return typeof candidate === 'string' ? candidate : undefined
}

const normalizeFormat = (
  rawFormat: string | undefined,
  defaultFormat: PrintTableFormat = 'pdf',
): PrintTableFormat | null => {
  if (!rawFormat) return defaultFormat

  const value = rawFormat.toLowerCase().trim()
  if (value === 'pdf') return 'pdf'
  if (value === 'excel' || value === 'xlsx') return 'excel'
  return null
}

const ensureFileExtension = (fileName: string, extension: '.pdf' | '.xlsx'): string => {
  return fileName.toLowerCase().endsWith(extension) ? fileName : `${fileName}${extension}`
}

const safeBaseFileName = (title?: string): string => {
  if (!title) return 'table-export'

  const normalized = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'table-export'
}

const toPdfColumns = (columns: PrintTableColumn[]): PDFExportColumn[] => {
  return columns.map((col) => {
    const width =
      typeof col.width === 'string'
        ? col.width
        : typeof col.width === 'number'
          ? `${col.width}mm`
          : undefined

    return {
      header: col.header,
      key: col.key,
      width,
      align: col.align,
    }
  })
}

const toExcelColumns = (columns: PrintTableColumn[]): ExcelExportColumn[] => {
  return columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: typeof col.width === 'number' ? col.width : undefined,
  }))
}

const isExpressResponse = (value: unknown): value is Response => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Response
  return typeof candidate.status === 'function' && typeof candidate.json === 'function'
}

export const CreatePrintTableController = (
  provider: PrintTableDataProvider,
  options?: PrintTableControllerOptions,
) => {
  return async (req: Request, res: Response) => {
    try {
      const format = normalizeFormat(getRawFormatQuery(req), options?.defaultFormat)

      if (!format) {
        return ResponseData.badRequest(
          res,
          'Format print tidak valid. Gunakan: pdf, excel, atau xlsx',
        )
      }

      const providerResult = await provider(req, res)

      if (isExpressResponse(providerResult) || res.headersSent) {
        return
      }

      const payload = providerResult

      if (!Array.isArray(payload.columns) || payload.columns.length === 0) {
        return ResponseData.badRequest(res, 'Columns wajib diisi untuk export tabel')
      }

      if (!Array.isArray(payload.data)) {
        return ResponseData.badRequest(res, 'Data tabel harus berupa array')
      }

      const baseFileName = payload.fileName || safeBaseFileName(payload.title)

      if (format === 'pdf') {
        const pdfService = new PDFExportService()
        const pdfBuffer = await pdfService.exportStandardExportToBuffer({
          title: payload.title || 'Data Export',
          columns: toPdfColumns(payload.columns),
          data: payload.data,
          ...payload.pdfOptions,
        })

        const fileName = ensureFileExtension(baseFileName, '.pdf')
        await pdfService.returnToResponseBuffer(res, pdfBuffer, fileName)
        return
      }

      const excelService = new ExcelExportService()
      const excelBuffer = await excelService.exportToBuffer({
        columns: toExcelColumns(payload.columns),
        data: payload.data,
        sheetName: payload.sheetName || 'Sheet1',
      })

      const fileName = ensureFileExtension(baseFileName, '.xlsx')
      await excelService.returnToResponseBuffer(res, excelBuffer, fileName)
      return
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  }
}
