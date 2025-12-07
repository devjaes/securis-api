import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { Request } from 'express'
import { HuffmanFrontService } from '../../application/services/huffman-front.service'

/**
 * Multipart Decryption Interceptor
 *
 * Intercepts multipart/form-data requests and decrypts the "payload" field
 * if present. This interceptor should be applied AFTER FilesInterceptor
 * so that the multipart body has already been parsed.
 *
 * The payload is expected to be a Huffman-encoded JSON string containing
 * the document data.
 */
@Injectable()
export class MultipartDecryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger('MultipartDecryption')

  constructor(private readonly huffmanFront: HuffmanFrontService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>()
    const contentType = request.headers['content-type'] || ''

    // Only process multipart/form-data requests
    if (!contentType.includes('multipart/form-data')) {
      return next.handle()
    }

    const body = request.body as Record<string, unknown>

    // Check if payload field exists
    if (!body?.payload || typeof body.payload !== 'string') {
      // No payload to decrypt, continue normally
      return next.handle()
    }

    try {
      this.logger.debug(`Decrypting multipart payload for ${request.url}`)

      // Decode the Huffman-encoded payload
      const decoded = this.huffmanFront.decode(body.payload)
      const parsedData = JSON.parse(decoded) as Record<string, unknown>

      this.logger.debug(
        `Decoded payload keys: ${Object.keys(parsedData).join(', ')}`,
      )

      // Replace body with decoded data, removing the payload field
      // Keep files reference if present
      const { payload: _, ...restOfBody } = body
      request.body = {
        ...restOfBody,
        ...parsedData,
      }

      this.logger.debug(
        `Final body keys: ${Object.keys(request.body).join(', ')}`,
      )

      return next.handle()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Failed to decrypt multipart payload: ${message}`)
      throw new BadRequestException(`Failed to decode payload: ${message}`)
    }
  }
}
