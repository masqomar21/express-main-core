import Redis from 'ioredis'
import { CONFIG } from '.'
import logger from '@/utilities/Log'

const redisBullConnection = new Redis({
  host: CONFIG.redis.host,
  port: Number(CONFIG.redis.port),
  password: CONFIG.redis.password,
  maxRetriesPerRequest: null,  // WAJIB untuk BullMQ
})

redisBullConnection.on('connect', () => {
  logger.info('✅ Redis BullMQ connected')
})

redisBullConnection.on('error', (err: Error) => {
  logger.error('❌ Redis BullMQ error:', err)
})

export default redisBullConnection
