import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as bcrypt from 'bcrypt';
import { users } from '../../database/schema';
import { DATABASE_CONNECTION } from '../../database/database.provider';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { User } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, createUserDto.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('El email ya está registrado');
    }

    // Crear usuario sin contraseña (se establece después)
    const [newUser] = await this.db
      .insert(users)
      .values({
        email: createUserDto.email,
        name: createUserDto.name,
        passwordHash: null,
      })
      .returning();

    // No retornar el passwordHash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  }

  async findAll(): Promise<User[]> {
    const allUsers = await this.db.select().from(users);

    // No retornar passwordHash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return allUsers.map(({ passwordHash, ...user }) => user as User);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    if (user.length === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user[0];
    return userWithoutPassword as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user.length === 0) {
      return null;
    }

    return user[0] as User;
  }

  async findByEmailWithPassword(email: string) {
    const user = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user.length === 0) {
      return null;
    }

    return user[0];
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Verificar que el usuario existe
    const existingUser = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    if (existingUser.length === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si el nuevo email ya existe (si se está actualizando)
    if (updateUserDto.email && updateUserDto.email !== existingUser[0].email) {
      const emailExists = await this.db
        .select()
        .from(users)
        .where(eq(users.email, updateUserDto.email))
        .limit(1);

      if (emailExists.length > 0) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Preparar datos de actualización
    const updateData: {
      email?: string;
      name?: string;
      passwordHash?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
    }

    if (updateUserDto.name) {
      updateData.name = updateUserDto.name;
    }

    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Actualizar usuario
    const [updatedUser] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  async remove(id: string): Promise<void> {
    const existingUser = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    if (existingUser.length === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.db.delete(users).where(eq(users.id, id));
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async setPassword(userId: string, password: string): Promise<void> {
    // Verificar que el usuario existe
    const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Actualizar contraseña
    await this.db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
