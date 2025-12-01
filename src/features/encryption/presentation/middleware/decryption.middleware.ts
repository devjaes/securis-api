import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HuffmanFrontService } from '../../application/services/huffman-front.service';

/**
 * Decryption Middleware
 *
 * Decrypts Huffman-encoded request bodies from the frontend.
 *
 * Expected input: { payload: "huffman_encoded_json_string" }
 * Output: The decoded JSON replaces req.body
 */
@Injectable()
export class DecryptionMiddleware implements NestMiddleware {
  constructor(private readonly huffmanFront: HuffmanFrontService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const body = req.body as { payload?: string } | undefined;
    if (!body?.payload) {
      return next();
    }

    try {
      const decoded = this.huffmanFront.decode(body.payload);
      req.body = JSON.parse(decoded) as Record<string, unknown>;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to decode payload: ${message}`);
    }
  }
}
