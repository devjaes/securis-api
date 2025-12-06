import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { DBService } from '../../core/database/database.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import type { User } from '../../core/database/generated/client'

@Injectable()
export class UsersService {
  constructor(private dbService: DBService) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const prisma = this.dbService.getAdminClient()

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: createUserDto.email },
    })

    if (existingUser) {
      throw new ConflictException('El email ya está registrado')
    }

    // Crear usuario sin contraseña (se establece después)
    const newUser = await prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        passwordHash: null,
      },
    })

    // No retornar el passwordHash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = newUser
    return userWithoutPassword
  }

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const prisma = this.dbService.getAdminClient()
    const allUsers = await prisma.user.findMany()

    // No retornar passwordHash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return allUsers.map(({ passwordHash, ...user }) => user)
  }

  async findOne(id: number): Promise<Omit<User, 'passwordHash'>> {
    const prisma = this.dbService.getAdminClient()
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async findByEmail(email: string): Promise<Omit<User, 'passwordHash'> | null> {
    const prisma = this.dbService.getAdminClient()
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return null
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    const prisma = this.dbService.getAdminClient()
    const user = await prisma.user.findUnique({
      where: { email },
    })

    return user
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const prisma = this.dbService.getAdminClient()

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // Verificar si el nuevo email ya existe (si se está actualizando)
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateUserDto.email },
      })

      if (emailExists) {
        throw new ConflictException('El email ya está registrado')
      }
    }

    // Preparar datos de actualización
    const updateData: {
      email?: string
      name?: string
      passwordHash?: string | null
    } = {}

    if (updateUserDto.email) {
      updateData.email = updateUserDto.email
    }

    if (updateUserDto.name) {
      updateData.name = updateUserDto.name
    }

    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 10)
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  }

  async remove(id: number): Promise<void> {
    const prisma = this.dbService.getAdminClient()

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado')
    }

    await prisma.user.delete({
      where: { id },
    })
  }

  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  async setPassword(userId: number, password: string): Promise<void> {
    const prisma = this.dbService.getAdminClient()

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    })
  }
}
