import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request } from 'express'
import { Observable } from 'rxjs'

interface RequestWithBody extends Request {
  body: { email?: string; isFirstTime?: boolean } & Record<string, unknown>
  _isFirstTimePassword?: boolean
}

/**
 * Guard que permite acceso sin JWT si el body contiene `email` y `isFirstTime: true`.
 * De lo contrario, requiere JWT válido.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithBody>()
    const body = request.body

    // Si viene email e isFirstTime es true, no requiere JWT (primer seteo)
    if (body?.email && body?.isFirstTime === true) {
      // Guardar flag en el request para que el controlador sepa que es primer seteo
      request._isFirstTimePassword = true
      return true
    }

    // Si no, requiere JWT (usuario autenticado cambiando su contraseña)
    request._isFirstTimePassword = false
    return super.canActivate(context) as Promise<boolean>
  }
}
