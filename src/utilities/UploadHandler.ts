import fs from 'fs'
import path from 'path'
import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { uploadFileToS3WithOutRedis } from './AwsHandler'
import { CONFIG } from '@/config'
import { AllowedMimeType } from '@/middleware/FileUploadMiddleware'
import { awsUploadQueue } from '@/queues/AwsUploadQueue'
import { UploadError } from '@/types/globalModule'

// =========================================================
// Config
// =========================================================
const STORAGE_MODE: 's3' | 'local' = CONFIG.saveToBucket ? 's3' : 'local'
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'public/uploads')
const TEMP_STORAGE_PATH = path.resolve(process.cwd(), 'public/temp')

const ALLOWED_MIME_TYPES: AllowedMimeType[] = [
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
]

// =========================================================
// Helper Functions
// =========================================================

/**
 * Generate nama file unik berdasarkan original name
 */
function generateFileName(originalname: string): string {
  const ext = path.extname(originalname)
  return `${uuidv4()}${ext}`
}

/**
 * Pastikan folder tujuan ada, jika tidak buat secara rekursif
 */
function ensureFolderExists(folderPath: string) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
}

/**
 * Validasi file yang diupload
 */
function validateFile(
  file: Express.Multer.File,
  allowedTypes: string[],
): { valid: boolean; reason?: string } {
  if (file.size > CONFIG.maxFileSize) {
    return { valid: false, reason: 'File size exceeds limit' }
  }
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, reason: `Invalid MIME type: ${file.mimetype}` }
  }
  return { valid: true }
}

/**
 * Simpan file ke folder lokal (uploads)
 */
async function storeFileLocally(file: FileType, folder: string): Promise<string> {
  const newFileName = generateFileName(file.originalname)
  const targetDir = path.join(LOCAL_STORAGE_PATH, folder)
  ensureFolderExists(targetDir)

  const fullPath = path.join(targetDir, newFileName)
  await fs.promises.writeFile(fullPath, file.buffer)

  return `/uploads/${folder}/${newFileName}`
}

/**
 * Simpan file ke folder temp (untuk async worker)
 */
async function saveFileToTemp(file: FileType): Promise<string> {
  ensureFolderExists(TEMP_STORAGE_PATH)
  const newFileName = generateFileName(file.originalname)
  const tempFilePath = path.join(TEMP_STORAGE_PATH, newFileName)

  await fs.promises.writeFile(tempFilePath, file.buffer)
  return tempFilePath
}

/**
 * Upload file ke S3 langsung (sinkron)
 */
async function uploadToS3(file: FileType, folder: string): Promise<string> {
  const newFileName = generateFileName(file.originalname)
  const result = await uploadFileToS3WithOutRedis({ ...file, originalname: newFileName }, folder)

  if (!result) throw new Error('Upload ke S3 gagal')
  return result
}

/**
 * Enqueue job upload async ke BullMQ
 */
export async function enqueueUpload(
  file: FileType,
  folder: string,
  modelName: string,
  recordId: number | string,
  updateFieldName: string,
) {
  const tempFilePath = await saveFileToTemp(file)
  const destinationKey = `${folder}/${updateFieldName}-${Date.now()}-${file.originalname}`

  await awsUploadQueue.add(`${CONFIG.appNameSanitized}-aws-upload`, {
    tempFilePath,
    destinationKey,
    modelName,
    recordId,
    updateData: {},
    fieldNameToUpdate: updateFieldName,
  })
}

// =========================================================
// Types
// =========================================================

type UploadOptions = {
  uploadMultiple?: boolean
  asyncUpload?: boolean
  modelName?: string
  recordId?: number | string
  updateFieldName?: string
  isRequired?: boolean
}

type UploadResult<T extends UploadOptions | undefined> =
  T extends { uploadMultiple: true }
    ? string[] | null
    : string | null

// =========================================================
// Core Functions
// =========================================================

/**
 * Handle file validation for uploads
 */
export const handleFileValidation = async (
  req: Request,
  fieldName: string,
  allowedTypes: AllowedMimeType[] = ALLOWED_MIME_TYPES,
  config?: {
    isRequired?: boolean
    uploadMultiple?: boolean
    maxCount?: number
    maxFileSize?: number
  },
): Promise<void> => {
  const files =
    req.files as
      | Express.Multer.File[]
      | { [fieldname: string]: Express.Multer.File[] }

  const defaulConfig = {
    isRequired: false,
    uploadMultiple: false,
    maxCount: config?.uploadMultiple ? 5 : 1,
    maxFileSize: CONFIG.maxFileSize,
  }
  config = { ...defaulConfig, ...config }

  const defaultMaxFiles = config?.uploadMultiple ? (config.maxCount || 5) : 1

  let fieldFiles: Express.Multer.File[] = []
  if (Array.isArray(files)) {
    fieldFiles = files.filter((f) => f.fieldname === fieldName)
  } else if (files && typeof files === 'object' && fieldName in files) {
    fieldFiles = files[fieldName]
  } else if (req.file && req.file.fieldname === fieldName) {
    fieldFiles = [req.file]
  }

  if ((!fieldFiles || fieldFiles.length === 0) && config?.isRequired) {
    throw new UploadError(
      `No file uploaded for field: ${fieldName}`,
      'FILE_NOT_FOUND',
      400,
    )
  }

  if (fieldFiles.length > defaultMaxFiles) {
    throw new UploadError(
      `Too many files uploaded for field: ${fieldName}. Maximum allowed is ${defaultMaxFiles}`,
      'LIMIT_FILE_COUNT',
      400,
    )
  }

  for (const file of fieldFiles) {
    const { valid, reason } = validateFile(file, allowedTypes)
    if (!valid) {
      throw new UploadError(
        `Upload rejected (${file.originalname}) in ${fieldName}: ${reason}`,
        'UNSUPPORTED_FILE_TYPE',
        400,
      )
    }
    if (config?.maxFileSize && file.size > config.maxFileSize) {
      throw new UploadError(
        `File size exceeds limit for file: ${file.originalname} in ${fieldName}`,
        'UPLOAD_ERROR',
        400,
      )
    }
  }
}

/**
 * Handle file upload, sync (local/S3) atau async (enqueue worker)
 */
export const handleUpload = async <T extends UploadOptions | undefined>(
  req: Request,
  fieldName: string,
  folder = 'default',
  allowedTypes: AllowedMimeType[] = ALLOWED_MIME_TYPES,
  options?: T,
): Promise<UploadResult<T>> => {
  await handleFileValidation(req, fieldName, allowedTypes, {
    uploadMultiple: options?.uploadMultiple || false,
    maxCount: options?.uploadMultiple ? 20 : 1,
    isRequired: options?.isRequired || false,
  })

  const files =
    req.files as
      | Express.Multer.File[]
      | { [fieldname: string]: Express.Multer.File[] }

  let fieldFiles: Express.Multer.File[] = []
  if (Array.isArray(files)) {
    fieldFiles = files.filter((f) => f.fieldname === fieldName)
  } else if (files && typeof files === 'object' && fieldName in files) {
    fieldFiles = files[fieldName]
  } else if (req.file && req.file.fieldname === fieldName) {
    fieldFiles = [req.file]
  }

  if (!fieldFiles || fieldFiles.length === 0) {
    console.warn(`No file uploaded for field: ${fieldName}`)
    return null
  }

  const targetFiles = options?.uploadMultiple ? fieldFiles : [fieldFiles[0]]
  const resultUrls: string[] = []

  try {
    for (const file of targetFiles) {
      const buffer: Buffer = file.buffer ?? fs.readFileSync(file.path)
      const fileUpload: FileType = {
        mimetype: file.mimetype,
        buffer,
        originalname: file.originalname,
      }

      if (options?.asyncUpload && options.modelName && options.recordId && options.updateFieldName) {
        await enqueueUpload(fileUpload, folder, options.modelName, options.recordId, options.updateFieldName)
        continue // async upload tidak langsung return URL
      }

      let resultUrl: string | null = null
      if (STORAGE_MODE === 's3') {
        resultUrl = await uploadToS3(fileUpload, folder)
      } else {
        resultUrl = await storeFileLocally(fileUpload, folder)
      }

      if (file.path) fs.unlinkSync(file.path)
      if (resultUrl) resultUrls.push(resultUrl)
    }

    if (options?.uploadMultiple) {
      return (resultUrls.length > 0 ? resultUrls : null) as UploadResult<T>
    }
    return (resultUrls[0] ?? null) as UploadResult<T>
  } catch (error) {
    console.error(`Upload failed on field "${fieldName}":`, error)
    if (error instanceof UploadError) {
      throw error
    }
    return null
  }
}
