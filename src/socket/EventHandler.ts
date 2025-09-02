import NotificationServices from '@/services/NotificationService'
import { Server, Socket } from 'socket.io'

export default function handleSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id)

    // Handle custom events here
    socket.on('register_notif', ({ userId }) => { // adjust the event name and parameters as needed
      if (!userId) {
        console.warn('userId is required for register_notif event')
        return
      }

      const roomName = NotificationServices.joinRoom(socket, userId)
      console.log(roomName)
      console.log(`User ${userId} joined room: ${roomName}`)
      // Emit an event back to the client
      io.to(roomName).emit('notif_registered', {
        message: `You have joined the room: ${roomName}`,
        socketId: socket.id,
      })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })
}