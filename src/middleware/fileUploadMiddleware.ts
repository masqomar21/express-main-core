import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { CONFIG } from '../config'

type ConfigType = {
  maxFileSize: number
  allowwedFileTypes?: RegExp
  saveToBucket?: boolean
}


const config : ConfigType = {
  maxFileSize: CONFIG.maxFileSize as number,
  allowwedFileTypes: /jpeg|jpg|png|pdf/,
  saveToBucket: CONFIG.saveToBucket,
}


export const fileUploadMiddleware = {
  fileUploadHandler : function (destinationFolder: string, otherOptions: ConfigType = {
    maxFileSize: config.maxFileSize,
  }) {
    
    const finalConfig = {
      ...config,
      ...otherOptions,
    }
    
    const uploadPath = path.join(process.cwd(), 'public', destinationFolder)
    
    // Buat folder jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadPath)
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
      },
    })
    
    return multer({
      storage: finalConfig.saveToBucket ? multer.memoryStorage() : storage,
      limits: { fileSize: finalConfig.maxFileSize },
      fileFilter: function (req, file, cb) {
        const fileTypes = finalConfig.allowwedFileTypes || /jpeg|jpg|png|pdf/
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase())
        const mimeType = fileTypes.test(file.mimetype)
        if (extName && mimeType) {
          cb(null, true)
        } else {
          cb(new Error('File type not supported'))
        }
      },
    })
  },
}
