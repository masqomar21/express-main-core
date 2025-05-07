import { createLogger, transports, format, Logger } from 'winston'
import { addColors } from 'winston/lib/winston/config'
import path from 'path'
import fs from 'fs'

const { combine, timestamp, printf, colorize } = format

const logFormat = printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)

// Pastikan folder logs/ ada
const logDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    db: 3,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    db: 'blue',
  },
}

addColors(customLevels.colors)

export const logger: Logger = createLogger({
  levels: customLevels.levels,
  format: combine(timestamp(), colorize(), logFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logDir, 'warn.log'), level: 'warn' }),
    new transports.File({ filename: path.join(logDir, 'info.log'), level: 'info' }),
    new transports.File({ filename: path.join(logDir, 'db.log'), level: 'db' }),
  ],
})
