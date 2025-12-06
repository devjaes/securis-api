import * as Joi from 'joi'
import { IConfig } from '../types'

export const config = (): { APP: IConfig } => ({
  APP: {
    // Application
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    API_PREFIX: process.env.API_PREFIX || 'api',

    // Database
    DB_SERVER: process.env.DB_SERVER!,
    DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    DB_NAME: process.env.DB_NAME!,
    DB_USER_ADMIN: process.env.DB_USER_ADMIN!,
    DB_PASSWORD_ADMIN: process.env.DB_PASSWORD_ADMIN!,
    DB_USER: process.env.DB_USER!,
    DB_USER_PASSWORD: process.env.DB_USER_PASSWORD!,

    // JWT
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',

    // Microsoft Authentication
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID!,
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET!,
    MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID!,
    MICROSOFT_REDIRECT_URI: process.env.MICROSOFT_REDIRECT_URI!,

    // Huffman Encryption Trees
    HUFFMAN_TREE_BACK_PATH: process.env.HUFFMAN_TREE_BACK_PATH!,
    HUFFMAN_TREE_DB_PATH: process.env.HUFFMAN_TREE_DB_PATH!,
    HUFFMAN_TREE_FRONT_PATH: process.env.HUFFMAN_TREE_FRONT_PATH!,
    // Development
    DEV_MODE: process.env.DEV_MODE === 'true',
    BYPASS_AUTH: process.env.BYPASS_AUTH === 'true',

    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN!,

    // SSL
    SSL_KEY_PATH: process.env.SSL_KEY_PATH!,
    SSL_CERT_PATH: process.env.SSL_CERT_PATH!,

    // Email
    MAIL_HOST: process.env.MAIL_HOST!,
    MAIL_PORT: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587,
    MAIL_SECURE: process.env.MAIL_SECURE === 'true',
    MAIL_USER: process.env.MAIL_USER!,
    MAIL_PASS: process.env.MAIL_PASS!,
    MAIL_FROM: process.env.MAIL_FROM!,

    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL!,
  },
})

export const configValidationSchema = Joi.object<IConfig>({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),

  // Database
  DB_SERVER: Joi.string().required(),
  DB_PORT: Joi.number().default(1433),
  DB_NAME: Joi.string().required(),
  DB_USER_ADMIN: Joi.string().required(),
  DB_PASSWORD_ADMIN: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_USER_PASSWORD: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('7d'),

  // Microsoft Authentication
  MICROSOFT_CLIENT_ID: Joi.string().required(),
  MICROSOFT_CLIENT_SECRET: Joi.string().required(),
  MICROSOFT_TENANT_ID: Joi.string().required(),
  MICROSOFT_REDIRECT_URI: Joi.string().uri().required(),

  // Huffman Encryption Trees
  HUFFMAN_TREE_BACK_PATH: Joi.string().required(),
  HUFFMAN_TREE_FRONT_PATH: Joi.string().required(),
  HUFFMAN_TREE_DB_PATH: Joi.string().required(),

  // Development
  DEV_MODE: Joi.boolean().default(false),
  BYPASS_AUTH: Joi.boolean().default(false),

  // CORS
  CORS_ORIGIN: Joi.string().uri().required(),

  // SSL
  SSL_KEY_PATH: Joi.string().required(),
  SSL_CERT_PATH: Joi.string().required(),

  // Email
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().default(587),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_USER: Joi.string().email().required(),
  MAIL_PASS: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),

  // Frontend
  FRONTEND_URL: Joi.string().uri().required(),
})
