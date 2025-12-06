import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import type { JwtModuleOptions } from '@nestjs/jwt'
import { MicrosoftStrategy } from './strategies/microsoft.strategy'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from '../users/users.module'
import { MailModule } from '../../providers/mail/mail.module'
import { EncryptionModule } from '../encryption'
import { PasswordResetService } from './password-reset.service'
import { AuthExceptionFilter } from './filters/auth-exception.filter'
import { OptionalJwtGuard } from './guards/optional-jwt.guard'
import { CustomConfigService } from '@/core/config/config.service'
@Module({
  imports: [
    PassportModule,
    UsersModule,
    MailModule,
    EncryptionModule,
    JwtModule.registerAsync({
      useFactory: (configService: CustomConfigService): JwtModuleOptions => {
        const expiresIn = configService.env.JWT_EXPIRATION
        return {
          secret: configService.env.JWT_SECRET,
          signOptions: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expiresIn: expiresIn as any,
          },
        }
      },
      inject: [CustomConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    MicrosoftStrategy,
    JwtStrategy,
    LocalStrategy,
    AuthService,
    PasswordResetService,
    AuthExceptionFilter,
    OptionalJwtGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
