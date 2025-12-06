// backend/src/database/database.service.ts

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common'
import { PrismaClient } from './generated/client'
import { CustomConfigService } from '../config/config.service'
import { PrismaMssql } from '@prisma/adapter-mssql'

@Injectable()
export class DBService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DBService.name)

  // Cliente Prisma con conexión admin (ve datos reales)
  public adminClient: PrismaClient

  // Cliente Prisma con conexión user (ve datos enmascarados)
  public userClient: PrismaClient

  constructor(private configService: CustomConfigService) {
    const {
      DB_USER_ADMIN,
      DB_PASSWORD_ADMIN,
      DB_NAME,
      DB_SERVER,
      DB_PORT,
      DB_USER,
      DB_USER_PASSWORD,
    } = this.configService.env
    const sqlAdminConfig = {
      user: DB_USER_ADMIN,
      password: DB_PASSWORD_ADMIN,
      database: DB_NAME,
      server: DB_SERVER,
      port: DB_PORT,
      options: {
        trustServerCertificate: true,
        encrypt: true,
      },
    }

    const sqlUserConfig = {
      user: DB_USER,
      password: DB_USER_PASSWORD,
      database: DB_NAME,
      server: DB_SERVER,
      port: DB_PORT,
      options: {
        trustServerCertificate: true,
        encrypt: true,
      },
    }

    const adapterAdmin = new PrismaMssql(sqlAdminConfig)
    const adapterUser = new PrismaMssql(sqlUserConfig)
    // Inicializar cliente admin
    this.adminClient = new PrismaClient({
      adapter: adapterAdmin,
    })

    // Inicializar cliente user
    this.userClient = new PrismaClient({
      adapter: adapterUser,
    })
  }

  async onModuleInit() {
    try {
      await this.adminClient.$connect()
      await this.userClient.$connect()
      this.logger.log('✅ Prisma clients connected successfully')
      this.logger.log('   - Admin client: Connected (sees real data)')
      this.logger.log('   - User client: Connected (sees masked data)')
    } catch (error) {
      this.logger.error('❌ Failed to connect Prisma clients:', error)
      throw error
    }
  }

  async onModuleDestroy() {
    try {
      await this.adminClient.$disconnect()
      await this.userClient.$disconnect()
      this.logger.log('✅ Prisma clients disconnected')
    } catch (error) {
      this.logger.error('❌ Error disconnecting Prisma clients:', error)
    }
  }

  /**
   * Obtiene el cliente Prisma con permisos de admin (ve datos reales)
   * Usar para:
   * - Operaciones de autenticación
   * - Operaciones de escritura
   * - Tareas administrativas
   */
  getAdminClient(): PrismaClient {
    return this.adminClient
  }

  /**
   * Obtiene el cliente Prisma con permisos de usuario (ve datos enmascarados)
   * Usar para:
   * - Listados públicos
   * - Consultas de lectura general
   */
  getUserClient(): PrismaClient {
    return this.userClient
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    admin: boolean
    user: boolean
  }> {
    try {
      await this.adminClient.$queryRaw`SELECT 1 as healthy`
      await this.userClient.$queryRaw`SELECT 1 as healthy`

      return {
        admin: true,
        user: true,
      }
    } catch (error) {
      this.logger.error('Health check failed:', error)
      return {
        admin: false,
        user: false,
      }
    }
  }
}
