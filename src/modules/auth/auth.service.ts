import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DBService } from '../../core/database/database.service';
import { CustomConfigService } from '../../core/config/config.service';
import type { User } from '../../core/database/generated/client';

export interface MicrosoftUser {
  microsoftId: string;
  email: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  profile?: Record<string, unknown>;
}

@Injectable()
export class AuthService {
  constructor(
    private dbService: DBService,
    private jwtService: JwtService,
    private configService: CustomConfigService,
  ) {}

  /**
   * Busca un usuario por email y actualiza sus datos de Microsoft.
   * Si el usuario no existe, lanza una excepción.
   *
   * @param microsoftUser Datos del usuario desde Microsoft
   * @returns Usuario actualizado
   * @throws Error si el usuario no existe en la base de datos
   */
  async findAndUpdateUser(microsoftUser: MicrosoftUser): Promise<User> {
    const prisma = this.dbService.getAdminClient();

    // Buscar usuario por email (el admin crea usuarios solo con email)
    const existingUser = await prisma.user.findUnique({
      where: { email: microsoftUser.email },
    });

    if (!existingUser) {
      throw new Error('USER_NOT_REGISTERED');
    }

    // Actualizar datos de Microsoft (microsoftId, name, etc.)
    const updateData: {
      microsoftId?: string;
      name?: string;
    } = {};

    // Actualizar microsoftId si no existe o es diferente
    if (!existingUser.microsoftId || existingUser.microsoftId !== microsoftUser.microsoftId) {
      updateData.microsoftId = microsoftUser.microsoftId;
    }

    // Actualizar nombre si es diferente
    if (existingUser.name !== microsoftUser.name) {
      updateData.name = microsoftUser.name;
    }

    // Solo actualizar si hay cambios
    if (Object.keys(updateData).length > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      });

      return updatedUser;
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

    const expiresIn = this.configService.env.JWT_EXPIRATION || '7d';

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: expiresIn as any,
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
