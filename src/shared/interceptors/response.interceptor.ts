import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common'
import { map, Observable } from 'rxjs'
import { ApiCustomRes, ApiRes } from '../dtos/res/api-response.dto'
import { HuffmanBackService } from '@/features/encryption/application/services/huffman-back.service'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiRes<string>
> {
  private readonly logger = new Logger(ResponseInterceptor.name)

  constructor(private readonly huffmanBack: HuffmanBackService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiRes<string>> | Promise<Observable<ApiRes<string>>> {
    const request = context.switchToHttp().getRequest()
    const url = request.url || request.path || ''

    // Skip encryption for certain endpoints
    if (this.shouldSkipEncryption(url)) {
      return next.handle().pipe(
        map((data) => {
          const defaultMessage = {
            content: ['Operación exitosa'],
            displayable: false,
          }

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

    return next.handle().pipe(
      map((data) => {
        const defaultMessage = {
          content: ['Operación exitosa'],
          displayable: false,
        }

        // Si el controlador ya devolvió una estructura { success, message, data }
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data
        ) {
          const response = data as {
            success: boolean
            message?: { content: string[]; displayable: boolean } | string
            data: unknown
          }
          // Normalizar el mensaje si es string
          let normalizedMessage = defaultMessage
          if (response.message) {
            if (typeof response.message === 'string') {
              normalizedMessage = {
                content: [response.message],
                displayable: true,
              }
            } else if (
              typeof response.message === 'object' &&
              'content' in response.message
            ) {
              normalizedMessage = response.message as {
                content: string[]
                displayable: boolean
              }
            }
          }
          // Cifrar solo el campo data
          return {
            success: response.success,
            message: normalizedMessage,
            data: this.encryptData(response.data),
          }
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
            data: this.encryptData(customRes.data || null),
          }
        }

        // Respuesta estándar - cifrar todo el objeto
        return {
          success: true,
          message: defaultMessage,
          data: this.encryptData(data || null),
        }
      }),
    )
  }

  private shouldSkipEncryption(url: string): boolean {
    const excludedPaths = [
      '/health',
      '/api/docs',
      '/pdf/download',
      '/encryption/test-message',
    ]
    return excludedPaths.some((path) => url.includes(path))
  }

  private encryptData(data: unknown): string | null {
    if (data === null || data === undefined) {
      return null
    }

    try {
      // Convertir el data a JSON string
      // Usar un replacer para manejar valores circulares y funciones
      const jsonString = JSON.stringify(data, (key, value) => {
        // Filtrar funciones y undefined
        if (typeof value === 'function' || value === undefined) {
          return null
        }
        return value
      })

      if (!jsonString || jsonString === 'null') {
        this.logger.warn('JSON stringify resulted in null or empty string')
        return null
      }

      // Verificar que el servicio puede cifrar este texto
      const canEncode = this.huffmanBack.canEncode(jsonString)
      if (!canEncode) {
        try {
          const unencodableChars =
            this.huffmanBack.getUnencodableCharacters(jsonString)
          this.logger.error(
            `Cannot encode data with Huffman - contains ${unencodableChars.length} unsupported character(s). Data length: ${jsonString.length}. First 10 unsupported chars: ${unencodableChars
              .slice(0, 10)
              .map((c) => `'${c}' (${c.charCodeAt(0)})`)
              .join(', ')}`,
          )
        } catch (validationError) {
          this.logger.error(
            `Cannot encode data with Huffman - error checking characters: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`,
          )
        }
        // Intentar cifrar de todas formas para obtener el error específico
      }

      this.logger.debug(
        `Attempting to encrypt data. JSON length: ${jsonString.length}, first 100 chars: ${jsonString.substring(0, 100)}`,
      )

      const encrypted = this.huffmanBack.encode(jsonString)

      if (!encrypted || encrypted.trim().length === 0) {
        this.logger.error('Huffman encoding returned null or empty string')
        return null
      }

      this.logger.debug(
        `Successfully encrypted data. Encrypted length: ${encrypted.length}`,
      )
      return encrypted
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(
        `Error encrypting response data: ${errorMessage}. This usually means the JSON contains characters not supported by the Huffman tree.`,
      )
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Stack trace: ${error.stack}`)
      }
      // En caso de error, devolver null para evitar exponer datos sin cifrar
      // El frontend deberá manejar este caso
      return null
    }
  }
}
