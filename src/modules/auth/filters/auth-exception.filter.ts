import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common'
import { Response } from 'express'

@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = exception.getStatus()
    const message = exception.message

    // Manejar error específico de contraseña no configurada
    if (message === 'PASSWORD_NOT_SET') {
      return response.status(status).json({
        statusCode: status,
        message: 'PASSWORD_NOT_SET',
        error:
          'Este usuario no tiene contraseña configurada. Debes establecer una contraseña primero.',
      })
    }

    // Error genérico de autenticación
    return response.status(status).json({
      statusCode: status,
      message: message || 'Unauthorized',
    })
  }
}
