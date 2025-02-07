import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3'
import logger from './log'


const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  useAccelerateEndpoint: true,
})

const pathToFolder: string = process.env.PATH_AWS || 'uploads'

type FileType = {
  mimetype: string;
  buffer: Buffer;
  originalname: string;
};

const uploadFileToS3WithOutRedis = async (file: FileType, folderPath: string): Promise<string | null> => {
  try {
    const { mimetype, buffer, originalname } = file
    const uniqueFilename = `${originalname.split('.')[0]}_${Date.now()}.${originalname.split('.')[1]}`
    
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `${pathToFolder}/${folderPath}/${uniqueFilename}`,
      Body: Buffer.from(buffer),
      ACL: ObjectCannedACL.public_read_write,
      ContentType: mimetype,
    }

    const command = new PutObjectCommand(uploadParams)
    await s3Client.send(command)

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${pathToFolder}/${folderPath}/${uniqueFilename}`
  } catch (error) {
    logger.error(error)
    return null
  }
}

export { uploadFileToS3WithOutRedis }