import Redis from 'ioredis'
import { CONFIG } from '.'
import logger from '@/utilities/Log'


class RedisService {
  private client: Redis

  constructor() {
    this.client = new Redis({
      host: CONFIG.redis.host,
      port: Number(CONFIG.redis.port),
      password: CONFIG.redis.password,
    })   
    this.client.on('connect', () => {
      logger.info('✅ Redis connected')
    })

    this.client.on('error', (err: Error) => {
      logger.error('❌ Redis error:', err)
    })
  }

  /**
   * Menyimpan data ke Redis dengan TTL (time-to-live)
   * @param key - Kunci data
   * @param value - Data yang akan disimpan
   * @param expInSecond - Waktu kadaluarsa dalam detik (default: 3600)
   */
  async set<T>(key: string, value: T, expInSecond: number = 3600): Promise<void> {
    if (typeof expInSecond !== 'number') {
      expInSecond = 3600
    }
    try {
      const data = typeof value === 'object' ? JSON.stringify(value) : String(value)
      await this.client.set(key, data, 'EX', expInSecond)
      logger.info(`🔵 Redis SET: ${key} (TTL: ${expInSecond}s)`)
    } catch (error) {
      logger.error('❌ Redis set error:', error)
    }
  }

  /**
   * Mengambil data dari Redis
   * @param key - Kunci data
   * @returns Data dari Redis atau null jika tidak ditemukan
   */
  async get(key: string): Promise<string | null> {
    try {
      const data = await this.client.get(key)
      if (data) {
        logger.info(`🔍 Redis GET: ${key}`)
        return data
      }
      logger.warn?.(`⚠️ Redis GET: ${key} (Data tidak ditemukan)`)
      return null
    } catch (error) {
      logger.error('❌ Redis get error:', error)
      return null
    }
  }

  /**
   * Menghapus data dari Redis
   * @param key - Kunci data
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
      logger.info(`🗑️ Redis DEL: ${key}`)
    } catch (error) {
      logger.error('❌ Redis del error:', error)
    }
  }

  /**
   * Membersihkan seluruh cache Redis
   */
  async flushAll(): Promise<void> {
    try {
      await this.client.flushall()
      logger.info('🧹 Redis cache cleared!')
    } catch (error) {
      logger.error('❌ Redis flush error:', error)
    }
  }

  /**
   * Menutup koneksi Redis dengan aman
   */
  async quit(): Promise<void> {
    try {
      await this.client.quit()
      logger.info('✅ Redis connection closed')
    } catch (error) {
      logger.error('❌ Redis quit error:', error)
    }
  }
}

const redisClient = new RedisService()
export default redisClient
