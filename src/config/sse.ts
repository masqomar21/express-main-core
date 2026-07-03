import { Request, Response } from 'express'
import redisClient from './redis'
import logger from '@/utilities/Log'

interface SseClient {
  id: string
  res: Response
}

class SseManager {
  // Map to store active SSE clients per channel
  private channels: Map<string, Set<SseClient>> = new Map()

  // Track Redis subscription handlers to avoid subscribing multiple times
  private redisSubscribers: Map<string, (message: string) => void> = new Map()

  /**
   * Express Handler to register an SSE client to a specific channel
   * @param req - Express Request
   * @param res - Express Response
   * @param channel - Redis channel name to listen to
   */
  public register = async (req: Request, res: Response, channel: string) => {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Prevent connection from idling/timing out
    res.write(': ping\n\n')

    const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const client: SseClient = { id: clientId, res }

    // Register client to the channel
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }
    this.channels.get(channel)!.add(client)

    logger.info(`🔌 SSE Client connected: ${clientId} on channel: ${channel}`)

    // Subscribe to Redis Pub/Sub if this is the first client on the channel
    await this.setupRedisSubscription(channel)

    // Send a heartbeat every 30 seconds to keep the connection alive
    const keepAlive = setInterval(() => {
      res.write(': keep-alive\n\n')
    }, 30000)

    // Handle client disconnect
    req.on('close', async () => {
      clearInterval(keepAlive)
      const clients = this.channels.get(channel)
      if (clients) {
        clients.delete(client)
        if (clients.size === 0) {
          this.channels.delete(channel)
          // Unsubscribe from Redis if no clients are left
          await this.removeRedisSubscription(channel)
        }
      }
      logger.info(`🔌 SSE Client disconnected: ${clientId} from channel: ${channel}`)
    })
  }

  /**
   * Set up Redis Pub/Sub subscription for a channel
   */
  private async setupRedisSubscription(channel: string) {
    if (this.redisSubscribers.has(channel)) {
      return // Already subscribed
    }

    const handler = (message: string) => {
      this.broadcast(channel, message)
    }

    this.redisSubscribers.set(channel, handler)
    await redisClient.subscribe(channel, handler)
  }

  /**
   * Clean up Redis subscription for a channel
   */
  private async removeRedisSubscription(channel: string) {
    const handler = this.redisSubscribers.get(channel)
    if (handler) {
      await redisClient.unsubscribe(channel, handler)
      this.redisSubscribers.delete(channel)
    }
  }

  /**
   * Broadcast message to all active SSE clients on a channel
   */
  private broadcast(channel: string, data: string) {
    const clients = this.channels.get(channel)
    if (!clients || clients.size === 0) return

    logger.info(`✉️ SSE Broadcasting to channel: ${channel} (${clients.size} clients)`)

    clients.forEach((client) => {
      try {
        // Send formatted SSE event
        client.res.write(`data: ${data}\n\n`)
      } catch (err) {
        logger.error(`❌ Failed to send SSE message to client ${client.id}:`, err)
      }
    })
  }
}

const sseManager = new SseManager()
export default sseManager
