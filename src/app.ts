import dotenv from 'dotenv'
dotenv.config()
import express, { type Express } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { CONFIG } from './config'
import http from 'http'
import { init } from './config/socket'
import { ResponseMiddleware } from './middlewares/responseMiddleware'
import { appRouter } from './routes'
import { errorMiddleware, notFoundMiddleware } from './middlewares/globalErrMiddleware'
import parsingArgs from './utils/parseArgs'

process.env.TZ = 'Asia/Jakarta'

const argsObj = parsingArgs(['--port'])

if (argsObj.port) {
  if (isNaN(Number(argsObj.port))) {
    console.error('Port must be a number')
    process.exit(1)
  }
  if (Number(argsObj.port) < 0 || Number(argsObj.port) > 65535) {
    console.error('Port must be between 0 and 65535')
    process.exit(1)
  }  
  CONFIG.port = Number(argsObj.port)
}

const app: Express = express()
const server = http.createServer(app)
const io = init(server)

app.use(cors({ origin: true, credentials: true }))
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  // res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next()
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('Clinet disconnected:', socket.id)
  })
})

app.use(ResponseMiddleware)

app.use('/public', express.static('public'))

appRouter(app)

app.all('*', notFoundMiddleware)
app.use(errorMiddleware)

server.listen(CONFIG.port, () => {
  console.log(`Server running on port ${CONFIG.port}`)
})
