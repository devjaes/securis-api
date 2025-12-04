import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { StringValue } from 'ms';
import { users } from '../../database/schema';
import { DATABASE_CONNECTION } from '../../database/database.provider';

export interface MicrosoftUser {
  microsoftId: string;
  email: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  profile?: Record<string, unknown>;
}

export type User = typeof users.$inferSelect;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Busca un usuario por email y actualiza sus datos de Microsoft.
   * Si el usuario no existe, lanza una excepción.
   *
   * @param microsoftUser Datos del usuario desde Microsoft
   * @returns Usuario actualizado
   * @throws NotFoundException si el usuario no existe en la base de datos
   */
  async findAndUpdateUser(microsoftUser: MicrosoftUser): Promise<User> {
    // Buscar usuario por email (el admin crea usuarios solo con email)
    const userByEmail = await this.db
      .select()
      .from(users)
      .where(eq(users.email, microsoftUser.email))
      .limit(1);

    if (userByEmail.length === 0) {
      throw new Error('USER_NOT_REGISTERED');
    }

    const existingUser = userByEmail[0];

    // Actualizar datos de Microsoft (microsoftId, name, etc.)
    const updateData: {
      microsoftId?: string;
      name?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    // Actualizar microsoftId si no existe o es diferente
    if (!existingUser.microsoftId || existingUser.microsoftId !== microsoftUser.microsoftId) {
      updateData.microsoftId = microsoftUser.microsoftId;
    }

    // Actualizar nombre si es diferente
    if (existingUser.name !== microsoftUser.name) {
      updateData.name = microsoftUser.name;
    }

    // Solo actualizar si hay cambios
    if (Object.keys(updateData).length > 1) {
      await this.db.update(users).set(updateData).where(eq(users.id, existingUser.id));

      // Retornar usuario actualizado
      return {
        ...existingUser,
        ...updateData,
      };
    }

    return existingUser;
  }

  generateJwtToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      microsoftId: user.microsoftId,
    };

    const expiresIn = this.configService.get<string>('auth.jwt.expiresIn') || '7d';

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: expiresIn as StringValue,
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        microsoftId: user.microsoftId,
      },
    };
  }
}
