import { Server, ServerOptions } from 'socket.io'
import { Server as HttpServer } from 'http'
import { createAdapter } from '@socket.io/redis-adapter'
import redisClient from './redis'

let io: Server | null = null

export const init = (server: HttpServer, options: Partial<ServerOptions> = {}): Server => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
    ...options, // Memungkinkan opsi tambahan saat inisialisasi
  })

  const pubClient = redisClient.client

  const subClient = pubClient.duplicate()

  pubClient.on('error', (err) => {
    console.error('❌ Socket.io Redis Adapter PubClient Error:', err)
  })

  subClient.on('error', (err) => {
    console.error('❌ Socket.io Redis Adapter SubClient Error:', err)
  })

  io.adapter(createAdapter(pubClient, subClient))

  return io
}

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io is not initialized!')
  }
  return io
}
