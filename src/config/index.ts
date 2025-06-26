import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  apiUrl: process.env.API_URL || "/api/",

  client : {
    url : process.env.CLIENT_URL || "http://localhost:3000",
    callBackGoogleOAuth : process.env.CLIENT_CALLBACK_GOOGLE_OAUTH_URL || "http://localhost:3000",
  },

  appName: process.env.APP_NAME || "app",
  appVersion: process.env.APP_VERSION || "1.0.0",
  port: process.env.PORT || 3000,
  appMode: process.env.APP_MODE || "development",
  appLOg: Boolean(process.env.APP_LOG) || true,
  maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, //10MB

  saveToBucket: process.env.FILE_SAVE_TO_BUCKET  ? process.env.FILE_SAVE_TO_BUCKET === 'true' : false,

  
  google  : {
    googleCredentialJSON : {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID || '',
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || '',
      private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
      client_email: process.env.GOOGLE_CLIENT_EMAIL || '',
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL || '',
      universe_domain: "googleapis.com"
    },
    googleDoc : {
      registerCard : process.env.GOOGLE_DOCUMENTS_ID_REGISTER_CARD || '1z8oN_CCUkYMcXKqQ9UOgEvMNxGoN2Nq9PQDlQ52XV2M',
    },
    GoogleOAuthConfig : {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID as string || '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET as string || '',
      callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
  },


  secret : {
    jwtSecret : process.env.AUTH_JWT_SECRET || 'qwerty',
  },
  redis : {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  }
};
