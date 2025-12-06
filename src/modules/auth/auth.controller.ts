import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Body,
  HttpCode,
  UnauthorizedException,
  UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService, MicrosoftUser  } from './auth.service';
import { SetPasswordDto } from './dto/set-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { PasswordResetService } from './password-reset.service';
import { AuthExceptionFilter } from './filters/auth-exception.filter';
import { OptionalJwtGuard } from './guards/optional-jwt.guard';
import { User } from '@/core/database/generated/client';

interface AuthenticatedRequest extends Request {
  user?: MicrosoftUser | { id: string; email: string; name: string; microsoftId: string };
  _isFirstTimePassword?: boolean;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  microsoftAuth() {}

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthCallback(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      const microsoftUser = req.user as MicrosoftUser | undefined;

      if (!microsoftUser) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Authentication failed',
        });
      }

      const user = await this.authService.findAndUpdateUser(microsoftUser);

      const tokenData = this.authService.generateJwtToken(user);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${tokenData.access_token}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in Microsoft auth callback:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      let errorMessage = 'Authentication failed';
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_REGISTERED') {
          errorMessage = 'Usuario no registrado. Contacta al administrador para crear tu cuenta.';
        } else {
          errorMessage = error.message;
        }
      }

      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`);
    }
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @UseFilters(AuthExceptionFilter)
  @HttpCode(HttpStatus.OK)
  login(@Req() req: AuthenticatedRequest) {
    // El usuario viene del validate() de LocalStrategy
    // Si no tiene contraseña, LocalStrategy lanza UnauthorizedException con 'PASSWORD_NOT_SET'
    const user = req.user as
      | { id: number; email: string; name: string; microsoftId?: string | null }
      | undefined;

    if (!user) {
      throw new UnauthorizedException('Authentication failed');
    }

    const tokenData = this.authService.generateJwtToken(user as User);

    return {
      ...tokenData,
      message: 'Login exitoso',
    };
  }

  @Post('set-password')
  @UseGuards(OptionalJwtGuard)
  @HttpCode(HttpStatus.OK)
  async setPassword(@Req() req: AuthenticatedRequest, @Body() setPasswordDto: SetPasswordDto) {
    let userId: number;

    // Si es primer seteo (viene email en el body), buscar usuario por email
    if (setPasswordDto.email && setPasswordDto.isFirstTime === true) {
      const user = await this.usersService.findByEmailWithPassword(setPasswordDto.email);

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      userId = user.id;
    } else {
      // Si no es primer seteo, usar el usuario del JWT
      const user = req.user as { id: number; email: string } | undefined;

      if (!user) {
        throw new UnauthorizedException('Usuario no autenticado');
      }

      userId = user.id;
    }

    // Establecer contraseña
    await this.usersService.setPassword(userId, setPasswordDto.password);

    return {
      message: 'Contraseña establecida exitosamente',
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    // Por seguridad, siempre retornamos el mismo mensaje
    // independientemente de si el email existe o no
    await this.passwordResetService.requestPasswordReset(forgotPasswordDto.email);

    return {
      message: 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );

    return {
      message: 'Contraseña restablecida exitosamente',
    };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
