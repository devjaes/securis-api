import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { eq, and, lt } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { randomBytes } from 'crypto';
import { passwordResetTokens, users } from '../../database/schema';
import { DATABASE_CONNECTION } from '../../database/database.provider';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { HuffmanBackService } from '../encryption/application';

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase,
    private usersService: UsersService,
    private mailService: MailService,
    private huffmanBack: HuffmanBackService,
  ) {}

  /**
   * Genera un token de recuperación de contraseña y envía el email
   */
  async requestPasswordReset(email: string): Promise<void> {
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
    await this.db
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          eq(passwordResetTokens.used, false),
        ),
      );

    // Guardar token en la base de datos
    await this.db.insert(passwordResetTokens).values({
      userId: user.id,
      token: encryptedToken,
      expiresAt,
      used: false,
    });

    // Enviar email con el token cifrado
    await this.mailService.sendPasswordResetEmail(email, encryptedToken);
  }

  /**
   * Valida el token y restablece la contraseña
   */
  async resetPassword(encryptedToken: string, newPassword: string): Promise<void> {
    // Buscar token en la base de datos
    const tokenRecords = await this.db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, encryptedToken))
      .limit(1);

    if (tokenRecords.length === 0) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const tokenRecord = tokenRecords[0];

    // Verificar si el token ya fue usado
    if (tokenRecord.used) {
      throw new BadRequestException('Este token ya fue utilizado');
    }

    // Verificar si el token expiró
    if (new Date() > tokenRecord.expiresAt) {
      throw new BadRequestException('Token expirado');
    }

    // Verificar que el usuario existe
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord.userId))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Actualizar contraseña del usuario
    await this.usersService.setPassword(tokenRecord.userId, newPassword);

    // Marcar token como usado
    await this.db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenRecord.id));
  }

  /**
   * Limpia tokens expirados (puede ejecutarse periódicamente)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.db
      .delete(passwordResetTokens)
      .where(
        and(
          lt(passwordResetTokens.expiresAt, now),
          eq(passwordResetTokens.used, false),
        ),
      );
  }
}

