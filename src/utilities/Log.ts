import { createLogger, transports, format, Logger } from 'winston'
import { addColors } from 'winston/lib/winston/config'

const { combine, timestamp, printf, colorize } = format

const myFormat = printf(
  ({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`,
)

const customLevels = {
  levels: {
    error: 0,
    info: 1,
    db: 2, // custom level for db logs
  },
  colors: {
    error: 'red',
    info: 'green',
    db: 'blue', // custom color for db logs
  },
}

addColors(customLevels.colors)

const logger: Logger = createLogger({
  levels: customLevels.levels,
  format: combine(timestamp(), colorize(), myFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'info.log', level: 'info' }),
    new transports.File({ filename: 'db.log', level: 'db' }),
  ],
})

export default logger
