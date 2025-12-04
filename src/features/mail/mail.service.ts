import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string | undefined;
    pass: string | undefined;
  };
  from: string | undefined;
  frontendUrl: string;
}

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    const mailConfig = this.configService.get<MailConfig>('mail');

    // Validar que las credenciales estén configuradas
    if (!mailConfig?.auth?.user || !mailConfig?.auth?.pass) {
      throw new Error(
        'Configuración de email incompleta. Por favor, configura MAIL_USER y MAIL_PASS en tu archivo .env',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: {
        user: mailConfig.auth.user,
        pass: mailConfig.auth.pass,
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('mail.frontendUrl');
    const from = this.configService.get<string>('mail.from');

    // El token viene cifrado, lo enviamos en el link
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    const mailOptions = {
      from: `Securis <${from}>`,
      to: email,
      subject: 'Recuperación de Contraseña - Securis',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperación de Contraseña</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
              <h2 style="color: #2c3e50;">Recuperación de Contraseña</h2>
              <p>Hola,</p>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Securis.</p>
              <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
              <p style="margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Restablecer Contraseña
                </a>
              </p>
              <p style="color: #7f8c8d; font-size: 12px;">
                O copia y pega este enlace en tu navegador:<br>
                <span style="word-break: break-all;">${resetUrl}</span>
              </p>
              <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
                Este enlace expirará en 1 hora por seguridad.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #95a5a6; font-size: 11px;">
                Si no solicitaste este cambio, por favor ignora este correo.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
        Recuperación de Contraseña - Securis
        
        Hola,
        
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en Securis.
        
        Si no solicitaste este cambio, puedes ignorar este correo.
        
        Para restablecer tu contraseña, visita el siguiente enlace:
        ${resetUrl}
        
        Este enlace expirará en 1 hora por seguridad.
        
        Si no solicitaste este cambio, por favor ignora este correo.
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
