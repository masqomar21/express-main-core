import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'

export interface ExcelExportColumn {
  header: string; // Label kolom di Excel
  key: string;    // Key dari data object
  width?: number; // Lebar kolom (optional)
}

export interface ExcelExportOptions {
  columns: ExcelExportColumn[];
  data: Record<string, any>[];
  sheetName?: string;
}

export interface ExcelFileExportOptions extends ExcelExportOptions {
  fileName: string;
  outputDir?: string;
}

export class ExcelExportService {
  private applyHeaderStyle(row: ExcelJS.Row) {
    row.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2F75B5' }, // biru tua
      }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
  }

  private applyRowStyle(row: ExcelJS.Row) {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
  }

  private generateWorkbook(options: ExcelExportOptions): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(options.sheetName || 'Sheet1')

    sheet.columns = options.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20,
    }))

    options.data.forEach((item) => {
      sheet.addRow(item)
    })

    this.applyHeaderStyle(sheet.getRow(1))

    sheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return // Skip header
      this.applyRowStyle(row)
    })

    return workbook
  }

  async exportToBuffer(options: ExcelExportOptions): Promise<Buffer> {
    const workbook = this.generateWorkbook(options)
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer as ArrayBuffer)
  }

  async exportToFile(options: ExcelFileExportOptions): Promise<string> {
    const workbook = this.generateWorkbook(options)
    const outputDir = options.outputDir || 'exports'

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const filePath = path.join(process.cwd(), 'public/' + outputDir, options.fileName)
    await workbook.xlsx.writeFile(filePath)
    return filePath
  }
}
