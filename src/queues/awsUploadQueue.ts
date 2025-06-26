// src/queues/awsUploadQueue.ts
import redisBullConnection from '@/config/redisBull'
import { Queue } from 'bullmq'


export const awsUploadQueue = new Queue('aws-upload', {
  connection: redisBullConnection,
})

export type AwsUploadJobData = {
  tempFilePath: string
  destinationKey: string
  modelName: string
  recordId: number | string
  updateData: Record<string, any>
  fieldNameToUpdate: string
}
