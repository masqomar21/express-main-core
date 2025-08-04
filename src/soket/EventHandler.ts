import { Server, Socket } from 'socket.io'

export default function handleSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id)

    // Handle custom events here
    socket.on('register_notif', async (soket_id) => { // adjust the event name and parameters as needed
      if (!soket_id) {
        console.warn('soket_id is required for register_notif event')
        return
      }
      console.log('Received custom event:', soket_id)

      const roomName = `notif-${soket_id}` // adsjust room name as needed
      socket.join(roomName)
      // Emit an event back to the client
      socket.to(roomName).emit('notif_registered', {
        message: `You have joined the room: ${roomName}`,
        socketId: socket.id,
      })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })
}