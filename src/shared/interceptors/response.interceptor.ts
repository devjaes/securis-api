import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { map, Observable } from 'rxjs'
import { ApiCustomRes, ApiRes } from '../dtos/res/api-response.dto'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiRes<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiRes<T>> | Promise<Observable<ApiRes<T>>> {
    return next.handle().pipe(
      map((data) => {
        const defaultMessage = {
          content: ['Operación exitosa'],
          displayable: false,
        }

        // Verificar si es una respuesta personalizada
        if (
          data &&
          typeof data === 'object' &&
          'customMessage' in data &&
          'data' in data
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const customRes = data as ApiCustomRes<any>
          return {
            success: true,
            message: customRes.customMessage || defaultMessage,
            data: customRes.data || null,
          }
        }

        return {
          success: true,
          message: defaultMessage,
          data: data || null,
        }
      }),
    )
  }
}
