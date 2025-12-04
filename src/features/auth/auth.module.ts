import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { DatabaseModule } from '../../database/database.module';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { EncryptionModule } from '../encryption';
import { PasswordResetService } from './password-reset.service';
import { AuthExceptionFilter } from './filters/auth-exception.filter';
import { OptionalJwtGuard } from './guards/optional-jwt.guard';

@Module({
  imports: [
    PassportModule,
    DatabaseModule,
    UsersModule,
    MailModule,
    EncryptionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = configService.get<string>('auth.jwt.expiresIn') || '7d';
        return {
          secret: configService.get<string>('auth.jwt.secret')!,
          signOptions: {
            expiresIn: expiresIn as StringValue,
          },
        };
      },
      inject: [ConfigService],
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
