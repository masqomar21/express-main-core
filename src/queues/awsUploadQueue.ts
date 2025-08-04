// src/queues/awsUploadQueue.ts
import redisBullConnection from '@/config/redisBull'
import { Queue } from 'bullmq'


export const awsUploadQueue = new Queue('aws-upload', {
  connection: redisBullConnection,
})

