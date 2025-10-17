// import { CONFIG } from '@/config'
// import { GoogleAuth, GoogleAuthOptions } from 'google-auth-library'
// import { docs_v1, drive_v3, google } from 'googleapis'
// import NodeCache from 'node-cache'

// const cache = new NodeCache({ stdTTL: 600 }) // cache 10 menit

// export type FieldsImage = {
//   url: string
//   width?: number
//   height?: number
//   unit?: 'PT'
// }

// export type PdfGeneratorParams = {
//   model: Record<string, any>
//   fieldsText: string[]
//   fieldsImage?: Record<string, FieldsImage> // { placeholder: { url, width, height, unit } }
//   templateId: string // Google Docs template ID
//   fileName: string // Output file name
//   mimeType?:
//     | 'application/pdf'
//     | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//   forceCopy?: boolean
// }

// export async function createTemplateFile(options: {
//   title: string
//   folderId?: string // opsional
//   initialText?: string // teks awal
// }): Promise<{
//   documentId: string
//   name: string
//   link: string
// }> {
//   const { title, folderId, initialText } = options

//   // 🚀 Siapkan payload untuk dikirim ke Apps Script
//   const body = new URLSearchParams({
//     title,
//     content: initialText || '',
//     ...(folderId ? { folderId } : {}),
//   })

//   console.log(`📤 Mengirim permintaan pembuatan dokumen "${title}" ke Apps Script...`)

//   const res = await fetch(
//     'https://script.google.com/macros/s/AKfycbx5eKSqS54uLqttkyg97GOKvFCZPeANjuxNrLUJfLJO6DYl-0tbrNyPJRBynzkuHiBZFA/exec',
//     {
//       method: 'POST',
//       body,
//     },
//   )

//   console.log('res', res.body)

//   const data = await res.json()

//   console.log('📥 Respon dari Apps Script:', data)

//   if (!res.ok || data.status !== 'success') {
//     console.error('❌ Gagal membuat dokumen:', data)
//     throw new Error(data.message || 'Gagal membuat Google Docs via Apps Script')
//   }

//   console.log(`✅ Dokumen berhasil dibuat: ${data.title} (${data.fileId})`)
//   console.log(`🔗 Link: ${data.url}`)

//   return {
//     documentId: data.fileId,
//     name: data.title,
//     link: data.url,
//   }
// }

// export class PdfGeneratorService {
//   private docsService: docs_v1.Docs
//   private driveService: drive_v3.Drive

//   constructor() {
//     const credentials = CONFIG.google.googleCredentialJSON as GoogleAuthOptions['credentials']

//     // 🔎 Cek apakah semua field penting tersedia
//     const requiredFields = [
//       'type',
//       'project_id',
//       'private_key_id',
//       'private_key',
//       'client_email',
//       'client_id',
//       'client_x509_cert_url',
//     ]

//     if (!credentials) throw new Error('Missing GOOGLE_CREDENTIAL_JSON in config')
//     for (const field of requiredFields) {
//       if (!(credentials && credentials[field as keyof typeof credentials])) {
//         throw new Error(`Missing Google credential field: ${field}`)
//       }
//     }

//     if (!credentials) throw new Error('Missing GOOGLE_CREDENTIAL_JSON in config')

//     const auth = new GoogleAuth({
//       credentials,
//       scopes: [
//         'https://www.googleapis.com/auth/documents',
//         'https://www.googleapis.com/auth/drive',
//       ],
//     })

//     console.log(auth)

//     this.docsService = google.docs({ version: 'v1', auth })
//     this.driveService = google.drive({ version: 'v3', auth })
//   }

//   async generatePdf(params: PdfGeneratorParams): Promise<{ filename: string; content: Buffer }> {
//     const { model, fieldsText, fieldsImage = {}, templateId, fileName, forceCopy = true } = params

//     // 1. Get template metadata
//     const templateMeta = await this.driveService.files.get({
//       fileId: templateId,
//       fields: 'id, modifiedTime, version',
//     })

//     const modifiedTime = templateMeta.data.modifiedTime
//     const cacheKey = `cached_google_doc_${templateId}`
//     const cached = cache.get<{ documentId: string; modifiedTime: string }>(cacheKey)

//     let documentId = cached?.documentId
//     if (forceCopy || !documentId || cached?.modifiedTime !== modifiedTime) {
//       const copied = await this.driveService.files.copy({
//         fileId: templateId,
//         requestBody: {
//           name: `Generated Document - ${Date.now()}`,
//         },
//       })
//       documentId = copied.data.id!
//       cache.set(cacheKey, { documentId, modifiedTime })
//     }

//     // 2. Replace text fields
//     const requestsText = fieldsText.map((field) => ({
//       replaceAllText: {
//         containsText: {
//           text: `{{${field}}}`,
//           matchCase: true,
//         },
//         replaceText: String(model[field] || ''),
//       },
//     }))

//     if (requestsText.length > 0) {
//       await this.docsService.documents.batchUpdate({
//         documentId,
//         requestBody: { requests: requestsText },
//       })
//     }

//     // 3. Replace image placeholders
//     for (const [placeholder, image] of Object.entries(fieldsImage)) {
//       await this.insertImageAtPlaceholder(documentId, `{{${placeholder}}}`, image)
//     }

//     // 4. Export document (DOCX or PDF)
//     const exportRes = await this.driveService.files.export(
//       {
//         fileId: documentId,
//         mimeType: params.mimeType || 'application/pdf',
//       },
//       { responseType: 'arraybuffer' },
//     )

//     return {
//       filename: fileName,
//       content: Buffer.from(exportRes.data as ArrayBuffer),
//     }
//   }

//   private async insertImageAtPlaceholder(
//     documentId: string,
//     placeholder: string,
//     image: FieldsImage,
//   ) {
//     const defaultImageUrl =
//       'https://newus-bucket.s3.ap-southeast-2.amazonaws.com/sso-newus/file_helper/138d291b-ec1c-409d-9790-c7101156dd57_1748603357599.png'

//     if (!this.isSupportedGoogleImageFormat(image.url)) {
//       console.warn(`Unsupported image format for URL: ${image.url}. Using default image.`)
//       image.url = defaultImageUrl
//     }
//     const document = await this.docsService.documents.get({ documentId })
//     const content = document.data.body?.content ?? []

//     let indexToInsert: number | null = null
//     let found = false

//     for (const element of content) {
//       if (found) break

//       // 1. Cek paragraph biasa
//       if (element.paragraph) {
//         const idx = this.findPlaceholderInParagraph(element.paragraph.elements, placeholder)
//         if (idx !== null) {
//           indexToInsert = idx
//           console.log('Placeholder found in paragraph:', placeholder, 'at index:', indexToInsert)
//           found = true
//           break
//         }
//       }

//       // 2. Cek isi table
//       if (element.table) {
//         for (const row of element.table.tableRows ?? []) {
//           for (const cell of row.tableCells ?? []) {
//             for (const cellContent of cell.content ?? []) {
//               const elements = cellContent.paragraph?.elements
//               if (elements) {
//                 const idx = this.findPlaceholderInParagraph(elements, placeholder)
//                 if (idx !== null) {
//                   indexToInsert = idx
//                   found = true
//                   break
//                 }
//               }
//             }
//             if (found) break
//           }
//           if (found) break
//         }
//       }
//     }

//     if (indexToInsert !== null) {
//       console.log(
//         'Inserting image at index:',
//         indexToInsert,
//         'for placeholder:',
//         placeholder,
//         'with image:',
//         image,
//       )
//       const requests: docs_v1.Schema$Request[] = [
//         {
//           deleteContentRange: {
//             range: {
//               startIndex: indexToInsert,
//               endIndex: indexToInsert + placeholder.length,
//             },
//           },
//         },
//         {
//           insertInlineImage: {
//             uri: image.url,
//             location: {
//               index: indexToInsert,
//             },
//             objectSize: {
//               height: { magnitude: image.height ?? 100, unit: image.unit ?? 'PT' },
//               width: { magnitude: image.width ?? 100, unit: image.unit ?? 'PT' },
//             },
//           },
//         },
//       ]

//       await this.docsService.documents.batchUpdate({
//         documentId,
//         requestBody: { requests },
//       })
//     } else {
//       console.warn(`Placeholder "${placeholder}" not found in document.`)
//     }
//   }

//   private isSupportedGoogleImageFormat(url: string): boolean {
//     const supportedExt = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
//     const ext = url.split('.').pop()?.toLowerCase()

//     console.log('Checking image URL:', url, 'with extension:', ext)
//     return !!ext && supportedExt.includes(`.${ext}`)
//   }

//   private findPlaceholderInParagraph(
//     elements: docs_v1.Schema$ParagraphElement[] = [],
//     placeholder: string,
//   ): number | null {
//     for (const el of elements) {
//       const contentText = el.textRun?.content
//       const startIndex = el.startIndex

//       // Debugging log (opsional, bisa kamu hapus kalau sudah yakin)
//       console.log('Checking element:', {
//         contentText,
//         startIndex,
//         hasPlaceholder: contentText?.includes(placeholder),
//       })

//       if (contentText && typeof startIndex === 'number' && contentText.includes(placeholder)) {
//         const relativeIndex = contentText.indexOf(placeholder)
//         return startIndex + relativeIndex
//       }
//     }

//     return null
//   }
// }

import { CONFIG } from '@/config'
import { GoogleAuth, GoogleAuthOptions } from 'google-auth-library'
import { docs_v1, drive_v3, google } from 'googleapis'
import NodeCache from 'node-cache'

// ============================================================
// 🔹 Cache Setup (10 menit)
// ============================================================
const cache = new NodeCache({ stdTTL: 600 })

// ============================================================
// 🔹 Types
// ============================================================
export type FieldsImage = {
  url: string
  width?: number
  height?: number
  unit?: 'PT'
}

export type PdfGeneratorParams = {
  model: Record<string, any>
  fieldsText: string[]
  fieldsImage?: Record<string, FieldsImage>
  templateId: string
  fileName: string
  mimeType?:
    | 'application/pdf'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  forceCopy?: boolean
}

// ============================================================
// 🔹 Fungsi Membuat Template Google Docs via Apps Script
// ============================================================
export async function createTemplateFile(options: {
  title: string
  folderId?: string
  initialText?: string
}): Promise<{ documentId: string; name: string; link: string }> {
  const { title, folderId, initialText } = options

  const body = new URLSearchParams({
    title,
    content: initialText || '',
    ...(folderId ? { folderId } : {}),
  })

  console.log(`📤 Membuat dokumen "${title}" melalui Apps Script...`)

  const res = await fetch(
    'https://script.google.com/macros/s/AKfycbx5eKSqS54uLqttkyg97GOKvFCZPeANjuxNrLUJfLJO6DYl-0tbrNyPJRBynzkuHiBZFA/exec',
    { method: 'POST', body },
  )

  const data = await res.json()
  console.log('📥 Respon Apps Script:', data)

  if (!res.ok || data.status !== 'success') {
    console.error('❌ Gagal membuat dokumen:', data)
    throw new Error(data.message || 'Gagal membuat Google Docs via Apps Script')
  }

  console.log(`✅ Dokumen berhasil dibuat: ${data.title} (${data.fileId})`)
  return { documentId: data.fileId, name: data.title, link: data.url }
}

// ============================================================
// 🔹 Kelas Utama: PdfGeneratorService
// ============================================================
export class PdfGeneratorService {
  private docsService: docs_v1.Docs
  private driveService: drive_v3.Drive

  constructor() {
    const credentials = CONFIG.google.googleCredentialJSON as GoogleAuthOptions['credentials']
    if (!credentials) throw new Error('Missing GOOGLE_CREDENTIAL_JSON in config')

    const requiredFields = [
      'type',
      'project_id',
      'private_key_id',
      'private_key',
      'client_email',
      'client_id',
      'client_x509_cert_url',
    ]

    for (const field of requiredFields) {
      if (!credentials[field as keyof typeof credentials]) {
        throw new Error(`Missing Google credential field: ${field}`)
      }
    }

    const auth = new GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive',
      ],
    })

    this.docsService = google.docs({ version: 'v1', auth })
    this.driveService = google.drive({ version: 'v3', auth })
  }

  // ==========================================================
  // 🔹 Generate PDF dari Template Google Docs
  // ==========================================================
  async generatePdf(params: PdfGeneratorParams): Promise<{ filename: string; content: Buffer }> {
    const {
      model,
      fieldsText,
      fieldsImage = {},
      templateId,
      fileName,
      mimeType = 'application/pdf',
      forceCopy = true,
    } = params

    // --- 1️⃣ Ambil metadata template
    const templateMeta = await this.driveService.files.get({
      fileId: templateId,
      fields: 'id, modifiedTime, version',
    })

    const modifiedTime = templateMeta.data.modifiedTime
    const cacheKey = `cached_google_doc_${templateId}`
    const cached = cache.get<{ documentId: string; modifiedTime: string }>(cacheKey)

    let documentId = cached?.documentId

    // --- 2️⃣ Salin dokumen jika belum ada cache atau template berubah
    if (forceCopy || !documentId || cached?.modifiedTime !== modifiedTime) {
      const copied = await this.driveService.files.copy({
        fileId: templateId,
        requestBody: { name: `Generated Document - ${Date.now()}` },
      })
      documentId = copied.data.id!
      cache.set(cacheKey, { documentId, modifiedTime })
    }

    // --- 3️⃣ Ganti semua field teks {{placeholder}}
    const requestsText: docs_v1.Schema$Request[] = fieldsText.map((field) => ({
      replaceAllText: {
        containsText: { text: `{{${field}}}`, matchCase: true },
        replaceText: String(model[field] || ''),
      },
    }))

    if (requestsText.length > 0) {
      await this.docsService.documents.batchUpdate({
        documentId,
        requestBody: { requests: requestsText },
      })
    }

    // --- 4️⃣ Ganti placeholder gambar
    for (const [placeholder, image] of Object.entries(fieldsImage)) {
      await this.insertImageAtPlaceholder(documentId, `{{${placeholder}}}`, image)
    }

    // --- 5️⃣ Ekspor hasil ke PDF/DOCX
    const exportRes = await this.driveService.files.export(
      { fileId: documentId, mimeType },
      { responseType: 'arraybuffer' },
    )

    return { filename: fileName, content: Buffer.from(exportRes.data as ArrayBuffer) }
  }

  // ==========================================================
  // 🔹 Fungsi: Sisipkan gambar di placeholder
  // ==========================================================
  private async insertImageAtPlaceholder(
    documentId: string,
    placeholder: string,
    image: FieldsImage,
  ) {
    const fallbackImage =
      'https://newus-bucket.s3.ap-southeast-2.amazonaws.com/sso-newus/file_helper/138d291b-ec1c-409d-9790-c7101156dd57_1748603357599.png'

    if (!this.isSupportedGoogleImageFormat(image.url)) {
      console.warn(`⚠️ Unsupported format: ${image.url}. Using fallback image.`)
      image.url = fallbackImage
    }

    const document = await this.docsService.documents.get({ documentId })
    const content = document.data.body?.content ?? []

    const indexToInsert = this.findPlaceholderIndex(content, placeholder)

    if (indexToInsert === null) {
      console.warn(`⚠️ Placeholder "${placeholder}" tidak ditemukan.`)
      return
    }

    console.log(`🖼️ Menyisipkan gambar di index ${indexToInsert} untuk "${placeholder}"`)

    const requests: docs_v1.Schema$Request[] = [
      {
        deleteContentRange: {
          range: { startIndex: indexToInsert, endIndex: indexToInsert + placeholder.length },
        },
      },
      {
        insertInlineImage: {
          uri: image.url,
          location: { index: indexToInsert },
          objectSize: {
            height: { magnitude: image.height ?? 100, unit: image.unit ?? 'PT' },
            width: { magnitude: image.width ?? 100, unit: image.unit ?? 'PT' },
          },
        },
      },
    ]

    await this.docsService.documents.batchUpdate({ documentId, requestBody: { requests } })
  }

  // ==========================================================
  // 🔹 Cek Format Gambar Didukung Google Docs
  // ==========================================================
  private isSupportedGoogleImageFormat(url: string): boolean {
    const supportedExt = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
    const ext = url.split('.').pop()?.toLowerCase()
    return !!ext && supportedExt.includes(`.${ext}`)
  }

  // ==========================================================
  // 🔹 Cari Placeholder Index dalam Dokumen
  // ==========================================================
  private findPlaceholderIndex(
    content: docs_v1.Schema$StructuralElement[] = [],
    placeholder: string,
  ): number | null {
    for (const element of content) {
      // --- Paragraph
      if (element.paragraph) {
        const idx = this.findInParagraph(element.paragraph.elements, placeholder)
        if (idx !== null) return idx
      }

      // --- Table
      if (element.table) {
        for (const row of element.table.tableRows ?? []) {
          for (const cell of row.tableCells ?? []) {
            for (const c of cell.content ?? []) {
              const idx = this.findInParagraph(c.paragraph?.elements, placeholder)
              if (idx !== null) return idx
            }
          }
        }
      }
    }
    return null
  }

  // ==========================================================
  // 🔹 Cari Placeholder dalam Elemen Paragraph
  // ==========================================================
  private findInParagraph(
    elements: docs_v1.Schema$ParagraphElement[] = [],
    placeholder: string,
  ): number | null {
    for (const el of elements) {
      const { content: text } = el.textRun || {}
      if (text && typeof el.startIndex === 'number' && text.includes(placeholder)) {
        return el.startIndex + text.indexOf(placeholder)
      }
    }
    return null
  }
}
