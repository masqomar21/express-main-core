// src/queues/awsUploadQueue.ts
import { CONFIG } from '@/config'
import redisBullConnection from '@/config/redisBull'
import { Queue } from 'bullmq'


export const awsUploadQueue = new Queue(`${CONFIG.appNameSanitized}-aws-upload`, {
  connection: redisBullConnection,
})

