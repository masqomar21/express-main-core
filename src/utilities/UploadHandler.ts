import fs from 'fs'
import path from 'path'
import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { FileType, uploadFileToS3WithOutRedis } from './AwsHandler'
import { CONFIG } from '@/config'
import { AllowedMimeType } from '@/middleware/FileUploadMiddleware'
import { awsUploadQueue } from '@/queues/awsUploadQueue'
// import { awsUploadQueue } from 'queues/awsUploadQueue'

// Config
const STORAGE_MODE: 's3' | 'local' = CONFIG.saveToBucket ? 's3' : 'local'
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'public/uploads')
const TEMP_STORAGE_PATH = path.resolve(process.cwd(), 'public/temp')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES : AllowedMimeType[] = [
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

/**
 * Generate nama file unik berdasarkan original name
 *  @param originalname - Nama asli file yang diupload
 *  @returns Nama file baru dengan UUID
 */
function generateFileName(originalname: string): string {
  const ext = path.extname(originalname)
  return `${uuidv4()}${ext}`
}

/**
 * Pastikan folder tujuan ada, jika tidak buat secara rekursif
 *  @param folderPath - Path folder yang akan dibuat
 */
function ensureFolderExists(folderPath: string) {
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true })
}

/**
 * Validasi file yang diupload
 *  @param file - File yang akan divalidasi
 *  @param allowedTypes - Array MIME type yang diizinkan
 *  @param maxSize - Ukuran maksimum file dalam byte (default: 5 MB)
 *  @returns Objek validasi dengan status dan alasan jika tidak valid
 */
function validateFile(
  file: Express.Multer.File,
  allowedTypes: string[],
  maxSize = MAX_FILE_SIZE,
): { valid: boolean; reason?: string } {
  if (file.size > maxSize) return { valid: false, reason: 'File size exceeds limit' }
  if (!allowedTypes.includes(file.mimetype)) return { valid: false, reason: `Invalid MIME type: ${file.mimetype}` }
  return { valid: true }
}

/**
 * Simpan file ke folder lokal (uploads) langsung, untuk mode local
 *  @param file - File yang akan disimpan
 *  @param folder - Folder tujuan di dalam uploads
 *  @returns URL file yang disimpan
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
 * Simpan file ke folder temp, untuk keperluan upload async worker
 *  @param file - File yang akan disimpan
 *  @returns Path file yang disimpan di folder temp
 * 
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
 *  @param file - File yang akan diupload
 *  @param folder - Folder tujuan di S3
 *  @returns URL file yang diupload
 *  @throws Error jika upload gagal
 */
async function uploadToS3(file: FileType, folder: string): Promise<string> {
  const newFileName = generateFileName(file.originalname)
  const result = await uploadFileToS3WithOutRedis({ ...file, originalname: newFileName }, folder)
  if (!result) throw new Error('Upload ke S3 gagal')
  return result
}

/**
 * Fungsi enqueue job upload async ke BullMQ
 *  @param file - File yang akan diupload
 *  @param folder - Folder tujuan di S3 atau lokal
 *  @param modelName - Nama model untuk update data
 *  @param recordId - ID record yang akan diupdate
 *  @param updateFieldName - Nama field yang akan diupdate
 *  @returns Promise<void>
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

  await awsUploadQueue.add('upload', {
    tempFilePath,
    destinationKey,
    modelName,
    recordId,
    updateData: {},
    fieldNameToUpdate: updateFieldName,
  })
}

type UploadOptions = {
    asyncUpload: boolean;
    modelName: string;
    recordId: number | string;
    updateFieldName: string;
  };
  
/**
   * Handle file upload, either sync (local/S3) or async (enqueue to background job)
   * 
   * @param req - Express Request containing the file
   * @param fieldName - Form field name of the uploaded file
   * @param folder - Destination folder (default: 'default')
   * @param allowedTypes - Array of allowed MIME types (default: ALLOWED_MIME_TYPES)
   * @param options - Optional settings for async upload
   * 
   * @returns URL of uploaded file or null if failed or enqueued
   */
export const handleUpload = async (
  req: Request,
  fieldName: string,
  folder = 'default',
  allowedTypes: AllowedMimeType[] = ALLOWED_MIME_TYPES,
  options?: UploadOptions,
): Promise<string | null> => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined
  const file = files?.[fieldName]?.[0] ?? req.file
  
  if (!file) return null
  
  const { valid, reason } = validateFile(file, allowedTypes)
  if (!valid) {
    console.warn(`Upload rejected [${fieldName}]: ${reason}`)
    return null
  }
  
  try {
    const buffer: Buffer = file.buffer ?? fs.readFileSync(file.path)
    const fileUpload: FileType = {
      mimetype: file.mimetype,
      buffer,
      originalname: file.originalname,
    }
  
    if (options?.asyncUpload && options.modelName && options.recordId && options.updateFieldName) {
      await enqueueUpload(fileUpload, folder, options.modelName, options.recordId, options.updateFieldName)
      return null // Async upload: no immediate URL
    }
  
    // Sync upload
    let resultUrl: string | null = null
  
    if (STORAGE_MODE === 's3') {
      resultUrl = await uploadToS3(fileUpload, folder)
    } else {
      resultUrl = await storeFileLocally(fileUpload, folder)
    }
  
    if (file.path) fs.unlinkSync(file.path) // Clean up local temp file if any
    return resultUrl
  } catch (error) {
    console.error(`Upload failed on field "${fieldName}":`, error)
    return null
  }
}