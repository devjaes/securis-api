import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DBService } from '../../core/database/database.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../../providers/mail/mail.service';
import { HuffmanBackService } from '../encryption/application';

@Injectable()
export class PasswordResetService {
  constructor(
    private dbService: DBService,
    private usersService: UsersService,
    private mailService: MailService,
    private huffmanBack: HuffmanBackService,
  ) {}

  /**
   * Genera un token de recuperación de contraseña y envía el email
   */
  async requestPasswordReset(email: string): Promise<void> {
    const prisma = this.dbService.getAdminClient();

    // Buscar usuario por email
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      // Simplemente retornamos sin error
      return;
    }

    // Generar token seguro (32 bytes = 64 caracteres hex)
    const token = randomBytes(32).toString('hex');

    // Cifrar el token antes de guardarlo
    const encryptedToken = this.huffmanBack.encode(token);

    // Fecha de expiración: 1 hora desde ahora
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Eliminar tokens anteriores no usados del mismo usuario
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Guardar token en la base de datos
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: encryptedToken,
        expiresAt,
        used: false,
      },
    });

    // Enviar email con el token cifrado
    await this.mailService.sendPasswordResetEmail(email, encryptedToken);
  }

  /**
   * Valida el token y restablece la contraseña
   */
  async resetPassword(encryptedToken: string, newPassword: string): Promise<void> {
    const prisma = this.dbService.getAdminClient();

    // Buscar token en la base de datos
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: encryptedToken },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Token inválido o expirado');
    }

    // Verificar si el token ya fue usado
    if (tokenRecord.used) {
      throw new BadRequestException('Este token ya fue utilizado');
    }

    // Verificar si el token expiró
    if (new Date() > tokenRecord.expiresAt) {
      throw new BadRequestException('Token expirado');
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: tokenRecord.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Actualizar contraseña del usuario
    await this.usersService.setPassword(tokenRecord.userId, newPassword);

    // Marcar token como usado
    await prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });
  }

  /**
   * Limpia tokens expirados (puede ejecutarse periódicamente)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const prisma = this.dbService.getAdminClient();
    const now = new Date();

    await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
        used: false,
      },
    });
  }
}

