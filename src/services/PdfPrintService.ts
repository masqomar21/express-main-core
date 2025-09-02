import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { Response } from 'express'

// ===== PDF Export Service =====

export class PDFExportService {
  private generateStandardExportHTML(options: PDFStandardExportOptions): string {
    const { title = 'Data Export', columns, data } = options

    const tableHeaders = columns
      .map(col =>
        `<th style="width: ${col.width || 'auto'}; text-align: ${col.align || 'left'}">${col.header}</th>`,
      ).join('')

    const tableRows = data
      .map(item => {
        const cells = columns
          .map(col => `<td style="text-align: ${col.align || 'left'}">${item[col.key] || ''}</td>`)
          .join('')
        return `<tr>${cells}</tr>`
      }).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            margin: 20mm;
            size: ${options.pageSize || 'A4'} ${options.orientation || 'portrait'};
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2F75B5;
            padding-bottom: 15px;
          }
          .header h1 {
            color: #2F75B5;
            font-size: 24px;
            margin: 0;
          }
          .export-info {
            text-align: right;
            font-size: 10px;
            color: #666;
            margin-bottom: 20px;
          }
          .table-container {
            width: 100%;
            overflow-x: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th {
            background: #2F75B5;
            color: white;
            font-weight: bold;
            padding: 12px 8px;
            border: 1px solid #1a5490;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            font-size: 11px;
            word-wrap: break-word;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          tr:hover {
            background-color: #e3f2fd;
          }
          .footer {
            position: fixed;
            bottom: 10mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 5px;
          }
          .page-number:after {
            content: "Page " counter(page) " of " counter(pages);
          }
          @media print {
            body { padding: 0 }
            .header, th, tr { page-break-after: avoid }
            tr { page-break-inside: avoid }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="export-info">
          Generated on: ${new Date().toLocaleString('id-ID')} | Total Records: ${data.length}
        </div>
        <div class="table-container">
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        <div class="footer">
          <div class="page-number"></div>
        </div>
      </body>
      </html>
    `
  }

  private async launchBrowser() {
    return await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    })
  }

  async exportStandardExportToBuffer(options: PDFStandardExportOptions): Promise<Buffer> {
    const browser = await this.launchBrowser()
    try {
      const page = await browser.newPage()
      const html = this.generateStandardExportHTML(options)
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })

      const pdfBuffer = await page.pdf({
        format: options.pageSize || 'A4',
        landscape: options.orientation === 'landscape',
        printBackground: options.printBackground || true,
        margin: {
          top: options.margin?.top || '20mm',
          right: options.margin?.right || '15mm',
          bottom: options.margin?.bottom || '20mm',
          left: options.margin?.left || '15mm',
        },
        preferCSSPageSize: options.preferCSSPageSize || true,
      })

      return Buffer.from(pdfBuffer as ArrayBuffer)
    } finally {
      await browser.close()
    }
  }

  async exporStandardExporttToFile(options: PDFStandardFileExportOptions): Promise<string> {
    const pdfBuffer = await this.exportStandardExportToBuffer(options)
    const outputDir = options.outputDir || 'exports'
    const publicDir = path.join(process.cwd(), 'public', outputDir)

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    const filePath = path.join(publicDir, options.fileName)
    fs.writeFileSync(filePath, pdfBuffer)

    return filePath
  }

  async exportFormPageSourceToBuffer( html: string, options: PDFExportOptions | null): Promise<Buffer> {
    const browser = await this.launchBrowser()
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })

      const pdfBuffer = await page.pdf({
        format: options?.pageSize || 'A4',
        landscape: options?.orientation === 'landscape',
        margin: {
          top: options?.margin?.top || '20mm',
          right: options?.margin?.right || '15mm',
          bottom: options?.margin?.bottom || '20mm',
          left: options?.margin?.left || '15mm',
        },
        printBackground: options?.printBackground || true,
        preferCSSPageSize: options?.preferCSSPageSize || true,
      })

      return Buffer.from(pdfBuffer as ArrayBuffer)
    } finally {
      await browser.close()
    }
  }

  async exportFormPageSourceToFile(html: string, options: PDFFileExportOptions | null): Promise<string> {
    const pdfBuffer = await this.exportFormPageSourceToBuffer(html, options)
    const outputDir = options?.outputDir || 'exports'
    const publicDir = path.join(process.cwd(), 'public', outputDir)

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    const filePath = path.join(publicDir, options?.fileName || 'export.pdf')
    fs.writeFileSync(filePath, pdfBuffer)

    return filePath
  }

  async returnToResponseBuffer(res: Response, buffer: Buffer, fileName: string): Promise<Buffer> {
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Type', 'application/pdf')
    res.send(buffer)
    return buffer
  }
}
