import { Server, ServerOptions } from 'socket.io'
import { Server as HttpServer } from 'http'

let io: Server | null = null

export const init = (server: HttpServer, options: Partial<ServerOptions> = {}): Server => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
    ...options, // Memungkinkan opsi tambahan saat inisialisasi
  })

  return io
}

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io is not initialized!')
  }
  return io
}