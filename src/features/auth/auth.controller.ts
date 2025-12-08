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
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request, Response } from 'express'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger'
import { AuthService, MicrosoftUser } from './auth.service'
import { SetPasswordDto } from './dto/set-password.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { UsersService } from '../users/users.service'
import { PasswordResetService } from './password-reset.service'
import { AuthExceptionFilter } from './filters/auth-exception.filter'
import { OptionalJwtGuard } from './guards/optional-jwt.guard'
import { User } from '@/core/database/generated/client'

interface AuthenticatedRequest extends Request {
  user?:
    | MicrosoftUser
    | { id: string; email: string; name: string; microsoftId: string }
  _isFirstTimePassword?: boolean
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Iniciar autenticación con Microsoft',
    description:
      'Redirige al usuario a la página de autenticación de Microsoft. Este endpoint no debe ser llamado directamente desde Swagger.',
  })
  microsoftAuth() {}

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Callback de autenticación Microsoft',
    description:
      'Endpoint de callback usado por Microsoft OAuth. Redirige al frontend con el token JWT. No debe ser llamado directamente.',
  })
  async microsoftAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    try {
      const microsoftUser = req.user as MicrosoftUser | undefined

      if (!microsoftUser) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Authentication failed',
        })
      }

      const user = await this.authService.findAndUpdateUser(microsoftUser)

      const tokenData = this.authService.generateJwtToken(user)

      const frontendUrl = process.env.FRONTEND_URL || 'https://localhost:5173'
      const redirectUrl = `${frontendUrl}/auth/callback?token=${tokenData.access_token}`

      return res.redirect(redirectUrl)
    } catch (error) {
      console.error('Error in Microsoft auth callback:', error)
      const frontendUrl = process.env.FRONTEND_URL || 'https://localhost:5173'

      let errorMessage = 'Authentication failed'
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_REGISTERED') {
          errorMessage =
            'Usuario no registrado. Contacta al administrador para crear tu cuenta.'
        } else {
          errorMessage = error.message
        }
      }

      return res.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`,
      )
    }
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @UseFilters(AuthExceptionFilter)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión con email y contraseña',
    description:
      'Autentica un usuario usando email y contraseña. Retorna un token JWT y los datos del usuario.',
  })
  @ApiBody({
    description: 'Credenciales de inicio de sesión',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'usuario@example.com',
          description: 'Email del usuario',
        },
        password: {
          type: 'string',
          example: 'MiContraseña123!',
          description: 'Contraseña del usuario',
        },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login exitoso',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoi...',
          description: 'Token JWT para autenticación',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'usuario@example.com' },
            name: { type: 'string', example: 'Juan Pérez' },
            microsoftId: { type: 'string', nullable: true, example: null },
          },
        },
        message: {
          type: 'string',
          example: 'Login exitoso',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciales inválidas o usuario no encontrado',
  })
  login(@Req() req: AuthenticatedRequest) {
    // El usuario viene del validate() de LocalStrategy
    // Si no tiene contraseña, LocalStrategy lanza UnauthorizedException con 'PASSWORD_NOT_SET'
    const user = req.user as
      | { id: number; email: string; name: string; microsoftId?: string | null }
      | undefined

    if (!user) {
      throw new UnauthorizedException('Authentication failed')
    }

    const tokenData = this.authService.generateJwtToken(user as User)

    return {
      ...tokenData,
      message: 'Login exitoso',
    }
  }

  @Post('set-password')
  @UseGuards(OptionalJwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Establecer o cambiar contraseña',
    description:
      'Permite establecer una contraseña nueva. Si es primera vez (isFirstTime=true), requiere email. Si no, requiere autenticación JWT.',
  })
  @ApiBody({ type: SetPasswordDto })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contraseña establecida exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Contraseña establecida exitosamente',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Usuario no encontrado o no autenticado',
  })
  async setPassword(
    @Req() req: AuthenticatedRequest,
    @Body() setPasswordDto: SetPasswordDto,
  ) {
    let userId: number

    // Si es primer seteo (viene email en el body), buscar usuario por email
    if (setPasswordDto.email && setPasswordDto.isFirstTime === true) {
      const user = await this.usersService.findByEmailWithPassword(
        setPasswordDto.email,
      )

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado')
      }

      userId = user.id
    } else {
      // Si no es primer seteo, usar el usuario del JWT
      const user = req.user as { id: number; email: string } | undefined

      if (!user) {
        throw new UnauthorizedException('Usuario no autenticado')
      }

      userId = user.id
    }

    // Establecer contraseña
    await this.usersService.setPassword(userId, setPasswordDto.password)

    return {
      message: 'Contraseña establecida exitosamente',
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar restablecimiento de contraseña',
    description:
      'Envía un email con un token para restablecer la contraseña. Por seguridad, siempre retorna el mismo mensaje independientemente de si el email existe.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Solicitud procesada (siempre retorna el mismo mensaje por seguridad)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.',
        },
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    // Por seguridad, siempre retornamos el mismo mensaje
    // independientemente de si el email existe o no
    await this.passwordResetService.requestPasswordReset(
      forgotPasswordDto.email,
    )

    return {
      message:
        'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablecer contraseña con token',
    description:
      'Restablece la contraseña del usuario usando el token recibido por email. El token debe ser válido y no expirado.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contraseña restablecida exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Contraseña restablecida exitosamente',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Token inválido, expirado o ya utilizado',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    )

    return {
      message: 'Contraseña restablecida exitosamente',
    }
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description:
      'Retorna los datos del usuario autenticado usando el token JWT.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Datos del usuario autenticado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'usuario@example.com' },
        name: { type: 'string', example: 'Juan Pérez' },
        microsoftId: { type: 'string', nullable: true, example: null },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido o no proporcionado',
  })
  getProfile(@Req() req: AuthenticatedRequest) {
    return req.user
  }
}
