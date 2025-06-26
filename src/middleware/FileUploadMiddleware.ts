import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { CONFIG } from '../config'

export type AllowedMimeType =
  | 'text/html'
  | 'application/javascript'
  | 'application/json'
  | 'text/css'
  | 'text/csv'
  | 'text/plain'
  | 'image/jpg'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'application/pdf'
  | 'application/zip'
  | 'audio/mpeg'
  | 'video/mp4'
  | 'image/webp'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/csv';

type ConfigType = {
  maxFileSize: number;
  allowedFileTypes?: AllowedMimeType[];
  saveToBucket?: boolean;
};

const defaultConfig: ConfigType = {
  maxFileSize: CONFIG.maxFileSize as number,
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
  ],
  saveToBucket: CONFIG.saveToBucket,
}

export const fileUploadMiddleware = {
  fileUploadHandler(destinationFolder: string, options: Partial<ConfigType> = {}) {
    const finalConfig: ConfigType = {
      ...defaultConfig,
      ...options,
    }

    const uploadPath = path.join(process.cwd(), 'public', destinationFolder)

    // Ensure the upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }

    const diskStorage = multer.diskStorage({
      destination: (_, __, cb) => cb(null, uploadPath),
      filename: (_, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        const fileExt = path.extname(file.originalname)
        cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`)
      },
    })

    return multer({
      storage: finalConfig.saveToBucket ? multer.memoryStorage() : diskStorage,
      limits: { fileSize: finalConfig.maxFileSize },
      fileFilter: (_, file, cb) => {
        const mime = file.mimetype.toLowerCase()
        const allowed = finalConfig.allowedFileTypes?.some(type => type === mime)
        if (allowed) {
          cb(null, true)
        } else {
          cb(new Error(`Unsupported file type: ${mime}`))
        }
      },
    })
  },
}
