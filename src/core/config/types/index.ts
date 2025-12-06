export interface IConfig {
  // Application
  NODE_ENV: string
  PORT: number
  API_PREFIX: string

  // Database
  DB_SERVER: string
  DB_PORT: number
  DB_NAME: string
  DB_USER_ADMIN: string
  DB_PASSWORD_ADMIN: string
  DB_USER: string
  DB_USER_PASSWORD: string

  // JWT
  JWT_SECRET: string
  JWT_EXPIRATION: string

  // Microsoft Authentication
  MICROSOFT_CLIENT_ID: string
  MICROSOFT_CLIENT_SECRET: string
  MICROSOFT_TENANT_ID: string
  MICROSOFT_REDIRECT_URI: string

  // Huffman Encryption Trees
  HUFFMAN_TREE_BACK_PATH: string
  HUFFMAN_TREE_DB_PATH: string
  HUFFMAN_TREE_FRONT_PATH: string

  // Development
  DEV_MODE: boolean
  BYPASS_AUTH: boolean

  // CORS
  CORS_ORIGIN: string

  // SSL
  SSL_KEY_PATH: string
  SSL_CERT_PATH: string

  // Email
  MAIL_HOST: string
  MAIL_PORT: number
  MAIL_SECURE: boolean
  MAIL_USER: string
  MAIL_PASS: string
  MAIL_FROM: string

  // Frontend
  FRONTEND_URL: string
}
