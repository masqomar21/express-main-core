import Redis from 'ioredis'
import { CONFIG } from './index'
import { logger } from '../core/logger'

class RedisService {
  private client: Redis

  constructor() {
    this.client = new Redis({
      host: CONFIG.redis.host,
      port: CONFIG.redis.port,
      password: CONFIG.redis.password,
    })

    this.client.on('connect', () => {
      logger.info('✅ Redis connected')
    })

    this.client.on('error', (err: Error) => {
      logger.error('❌ Redis error:', err.message)
    })
  }

  async set<T>(key: string, value: T, ttlInSeconds = 3600): Promise<void> {
    try {
      const data = typeof value === 'object' ? JSON.stringify(value) : String(value)
      await this.client.set(key, data, 'EX', ttlInSeconds)
      logger.info(`🟢 Redis SET: [${key}] TTL: ${ttlInSeconds}s`)
    } catch (error: any) {
      logger.error(`❌ Redis set error for key [${key}]: ${error.message}`)
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const data = await this.client.get(key)
      if (data) {
        logger.info(`🔍 Redis GET: [${key}]`)
        return data
      }
      logger.warn(`⚠️ Redis key not found: [${key}]`)
      return null
    } catch (error: any) {
      logger.error(`❌ Redis get error for key [${key}]: ${error.message}`)
      return null
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
      logger.info(`🗑️ Redis DEL: [${key}]`)
    } catch (error: any) {
      logger.error(`❌ Redis del error for key [${key}]: ${error.message}`)
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.client.flushall()
      logger.info('🧹 Redis flushAll executed')
    } catch (error: any) {
      logger.error(`❌ Redis flushAll error: ${error.message}`)
    }
  }

  async quit(): Promise<void> {
    try {
      await this.client.quit()
      logger.info('✅ Redis connection closed')
    } catch (error: any) {
      logger.error(`❌ Redis quit error: ${error.message}`)
    }
  }
}

const redisClient = new RedisService()
export default redisClient
