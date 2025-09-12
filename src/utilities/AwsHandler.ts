
import { S3Client, PutObjectCommand, ObjectCannedACL, DeleteObjectCommand } from '@aws-sdk/client-s3'
import logger from './Log'
import { CONFIG } from '@/config'



const s3Client = new S3Client({
  endpoint: CONFIG.s3.endpoint || undefined,
  region: CONFIG.s3.region,
  credentials: {
    accessKeyId: CONFIG.s3.accessKeyId,
    secretAccessKey: CONFIG.s3.secretAccessKey,
  },
  forcePathStyle: CONFIG.s3.endpoint ? true : false, // WAJIB untuk selain AWS
  useAccelerateEndpoint: CONFIG.s3.endpoint ? false : true, // Gunakan endpoint percepatan jika ada
})

const pathToFolder: string = CONFIG.s3.path

/**
 * Upload file ke S3 tanpa menggunakan Redis
 * @param file - File yang akan diupload
 * @param folderPath - Path folder tujuan di S3
 * @returns URL file yang diupload atau null jika gagal
 */
const uploadFileToS3WithOutRedis = async (file: FileType, folderPath: string): Promise<string | null> => {
  try {
    const { mimetype, buffer, originalname } = file
    const uniqueFilename = `${originalname.split('.')[0]}_${Date.now()}.${originalname.split('.')[1]}`
    
    const uploadParams = {
      Bucket: CONFIG.s3.bucket,
      Key: `${pathToFolder}/${folderPath}/${uniqueFilename}`,
      Body: Buffer.from(buffer),
      ACL: ObjectCannedACL.public_read_write,
      ContentType: mimetype,
    }

    const command = new PutObjectCommand(uploadParams)
    await s3Client.send(command)

    if (!CONFIG.s3.endpoint) {
      return `https://${CONFIG.s3.bucket}.s3.${CONFIG.s3.region}.amazonaws.com/${pathToFolder}/${folderPath}/${uniqueFilename}`
    }
    // Jika menggunakan endpoint khusus, gunakan format URL yang sesuai
    return `${CONFIG.s3.endpoint}/${CONFIG.s3.bucket}/${pathToFolder}/${folderPath}/${uniqueFilename}`

    // return  `${process.env.AWS_ENDPOINT}/${pathToFolder}/${folderPath}/${uniqueFilename}`
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    logger.error(error)
    return null
  }
}


/**
 * Hapus file dari S3 berdasarkan URL
 * @param fileUrl - URL file yang akan dihapus
 */
const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  let indexSLice = 3 // Jika menggunakan endpoint, potong dari index ke-3, jika tidak potong dari index ke-4

  if (CONFIG.s3.endpoint) {
    indexSLice = 4 // Jika menggunakan endpoint, potong dari index ke-2
  }
  const filePath = fileUrl.split('/').slice(indexSLice).join('/') // Mengambil path file dari URL
  try {

    // console.log('filePath', filePath)
    const deleteParams = {
      Bucket: CONFIG.s3.bucket!,
      Key: filePath,
    }

    const command = new DeleteObjectCommand(deleteParams)
    await s3Client.send(command)
  } catch (error) {
    console.error('Error deleting file from S3:', error)
    logger.error(error)
  }
}

export { uploadFileToS3WithOutRedis, deleteFileFromS3 }