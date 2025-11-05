import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    tenantId: process.env.MICROSOFT_TENANT_ID!,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
  },
  devMode: process.env.DEV_MODE === 'true',
  bypassAuth: process.env.BYPASS_AUTH === 'true',
}));
