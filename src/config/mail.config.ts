import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER || undefined,
    pass: process.env.MAIL_PASS || undefined, // App password for Gmail
  },
  from: process.env.MAIL_FROM || process.env.MAIL_USER || undefined,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
