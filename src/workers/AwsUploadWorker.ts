import { Worker } from 'bullmq'
import prisma from '@/config/database'
import fs from 'fs/promises'
import path from 'path'
import { uploadFileToS3WithOutRedis } from '@/utilities/AwsHandler'
import redisBullConnection from '@/config/redisBull'

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.txt': 'text/plain',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',

  // Added to match ALLOWED_MIME_TYPES
  '.webp': 'image/webp',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'application/csv', // or 'application/csv' depending on use
}

const worker = new Worker(
  'aws-upload',
  async job => {
    const { tempFilePath, destinationKey, modelName, recordId, updateData, fieldNameToUpdate } = job.data
    try {
      const absolutePath = path.resolve(tempFilePath)
      const fileBuffer = await fs.readFile(absolutePath)

      const ext = path.extname(absolutePath).toLowerCase()
      const mimeType = mimeTypes[ext as string] || 'application/octet-stream'

      const uploadUrl = await uploadFileToS3WithOutRedis(
        {
          mimetype: mimeType, // opsional
          buffer: fileBuffer,
          originalname: path.basename(destinationKey),
        },
        path.dirname(destinationKey),
      )

      if (!uploadUrl) throw new Error('Upload ke AWS gagal')

      const modelDelegate = (prisma as any)[modelName]
      if (!modelDelegate || typeof modelDelegate.update !== 'function') {
        throw new Error(`Model ${modelName} tidak ditemukan atau tidak memiliki method update`)
      }

      const updatedPayload = {
        ...updateData,
        [fieldNameToUpdate]: uploadUrl,
      }

      await modelDelegate.update({
        where: { id: typeof recordId === 'string' ? Number(recordId) : recordId },
        data: updatedPayload,
      })

      console.log('Upload URL:', uploadUrl)
      console.log('Update payload:', updatedPayload)
      console.log('Updating model:', modelName, 'with recordId:', recordId)

      try {
        await fs.unlink(absolutePath)
        console.log('File berhasil dihapus dari lokal')
      } catch (unlinkError) {
        console.error('Gagal menghapus file lokal:', unlinkError)
      }      


      return { message: 'Upload berhasil', location: uploadUrl }
    } catch (error) {
      console.error('Worker job error:', error)
      throw error
    }
  },
  { connection: redisBullConnection },
)

worker.on('completed', job => {
  console.log(`Job ${job.id} selesai`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} gagal:`, err)
})

export default worker
