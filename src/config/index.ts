import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || '/api/',
  appName: process.env.APP_NAME || 'App',
  appVersion: process.env.APP_VERSION || '1.0.0',
  port: process.env.PORT || 3000,
  appMode: process.env.APP_MODE || 'development',
  appLog: process.env.APP_LOG !== 'false',
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,

  secret: {
    jwtSecret: process.env.AUTH_JWT_SECRET || 'qwerty'
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || ''
  }
};
