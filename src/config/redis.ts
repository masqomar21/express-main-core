import Redis from 'ioredis'
import { CONFIG } from '.'
import logger from '@/utilities/Log'

class RedisService {
  private client: Redis
  private pubClient: Redis | null = null
  private subClient: Redis | null = null
  private subscribers: Map<string, Set<(message: string) => void>> = new Map()

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

  private getPubClient(): Redis {
    if (!this.pubClient) {
      this.pubClient = new Redis({
        host: CONFIG.redis.host,
        port: Number(CONFIG.redis.port),
        password: CONFIG.redis.password,
      })
      this.pubClient.on('connect', () => {
        logger.info('✅ Redis Pub connected')
      })
      this.pubClient.on('error', (err: Error) => {
        logger.error('❌ Redis Pub error:', err)
      })
    }
    return this.pubClient
  }

  private getSubClient(): Redis {
    if (!this.subClient) {
      this.subClient = new Redis({
        host: CONFIG.redis.host,
        port: Number(CONFIG.redis.port),
        password: CONFIG.redis.password,
      })
      this.subClient.on('connect', () => {
        logger.info('✅ Redis Sub connected')
      })
      this.subClient.on('error', (err: Error) => {
        logger.error('❌ Redis Sub error:', err)
      })
      this.subClient.on('message', (channel: string, message: string) => {
        const callbacks = this.subscribers.get(channel)
        if (callbacks) {
          callbacks.forEach((cb) => {
            try {
              cb(message)
            } catch (err) {
              logger.error(`❌ Error in Redis sub callback for channel ${channel}:`, err)
            }
          })
        }
      })
    }
    return this.subClient
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
   *
   * @param pattern - Pola kunci untuk menghapus (misal: 'user_*' untuk menghapus semua kunci yang diawali 'user_')
   * Menghapus beberapa kunci berdasarkan pola (pattern)
   */
  async deleteKeysByPattern(pattern: string) {
    let cursor = '0'
    do {
      const [nextCursor, foundKeys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = nextCursor
      if (foundKeys.length > 0) {
        await this.client.del(...foundKeys)
      }
    } while (cursor !== '0')
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
   * Mengirim pesan ke channel tertentu (Publish)
   * @param channel - Nama channel
   * @param message - Pesan yang akan dikirim (bisa object atau string)
   */
  async publish<T>(channel: string, message: T): Promise<number> {
    try {
      const data = typeof message === 'object' ? JSON.stringify(message) : String(message)
      const pub = this.getPubClient()
      const count = await pub.publish(channel, data)
      logger.info(`📢 Redis PUB: ${channel} (${count} subscribers)`)
      return count
    } catch (error) {
      logger.error(`❌ Redis publish error on channel ${channel}:`, error)
      return 0
    }
  }

  /**
   * Berlangganan ke channel tertentu (Subscribe)
   * @param channel - Nama channel
   * @param callback - Fungsi callback saat menerima pesan
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      const sub = this.getSubClient()

      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, new Set())
        await sub.subscribe(channel)
        logger.info(`🔔 Redis SUB: Subscribed to channel ${channel}`)
      }

      this.subscribers.get(channel)!.add(callback)
    } catch (error) {
      logger.error(`❌ Redis subscribe error on channel ${channel}:`, error)
    }
  }

  /**
   * Berhenti berlangganan dari channel tertentu
   * @param channel - Nama channel
   * @param callback - (Opsional) Fungsi callback spesifik yang akan dihapus. Jika tidak diisi, semua callback untuk channel ini akan dihapus.
   */
  async unsubscribe(channel: string, callback?: (message: string) => void): Promise<void> {
    try {
      const callbacks = this.subscribers.get(channel)
      if (!callbacks) return

      if (callback) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscribers.delete(channel)
          if (this.subClient) {
            await this.subClient.unsubscribe(channel)
          }
          logger.info(`🔕 Redis SUB: Unsubscribed from channel ${channel}`)
        }
      } else {
        this.subscribers.delete(channel)
        if (this.subClient) {
          await this.subClient.unsubscribe(channel)
        }
        logger.info(`🔕 Redis SUB: Unsubscribed from channel ${channel} (all callbacks)`)
      }
    } catch (error) {
      logger.error(`❌ Redis unsubscribe error on channel ${channel}:`, error)
    }
  }

  /**
   * Menutup koneksi Redis dengan aman
   */
  async quit(): Promise<void> {
    try {
      const promises: Promise<any>[] = [this.client.quit()]
      if (this.pubClient) {
        promises.push(this.pubClient.quit())
      }
      if (this.subClient) {
        promises.push(this.subClient.quit())
      }
      await Promise.all(promises)
      logger.info('✅ All Redis connections closed')
    } catch (error) {
      logger.error('❌ Redis quit error:', error)
    }
  }
}

const redisClient = new RedisService()
export default redisClient
