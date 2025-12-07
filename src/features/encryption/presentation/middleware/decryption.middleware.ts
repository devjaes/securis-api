import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { HuffmanFrontService } from '../../application/services/huffman-front.service'

/**
 * Decryption Middleware
 *
 * Decrypts Huffman-encoded request bodies from the frontend.
 * Supports both JSON and multipart/form-data requests.
 *
 * Expected input: { payload: "huffman_encoded_json_string" }
 * Output: The decoded JSON replaces req.body
 */
@Injectable()
export class DecryptionMiddleware implements NestMiddleware {
  private readonly logger = new Logger('DecryptionMiddleware')

  constructor(private readonly huffmanFront: HuffmanFrontService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next()
    }

    const body = req.body as { payload?: string } | undefined
    if (!body?.payload) {
      return next()
    }

    try {
      const decoded = this.huffmanFront.decode(body.payload)
      const parsedData = JSON.parse(decoded) as Record<string, unknown>

      // Check if this is a multipart/form-data request
      const contentType = req.headers['content-type'] || ''
      const isMultipart = contentType.includes('multipart/form-data')

      if (isMultipart) {
        // For multipart requests, merge decoded data with existing body
        // This preserves file references that Multer has added
        req.body = {
          ...parsedData,
          // Keep any files that were uploaded (Multer adds these)
        }
        this.logger.debug(`Decrypted multipart payload for ${req.url}`)
      } else {
        // For JSON requests, replace body entirely
        req.body = parsedData
        this.logger.debug(`Decrypted JSON payload for ${req.url}`)
      }

      next()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Failed to decode payload: ${message}`)
      throw new BadRequestException(`Failed to decode payload: ${message}`)
    }
  }
}
