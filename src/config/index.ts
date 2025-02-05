import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  apiUrl: process.env.API_URL || "/api/",

  appName: process.env.APP_NAME || "app",
  appVersion: process.env.APP_VERSION || "1.0.0",
  port: process.env.PORT || 3000,
  appMode: process.env.APP_MODE || "development",
  appLOg: Boolean(process.env.APP_LOG) || true,
  maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, //10MB
};
