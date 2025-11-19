import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HuffmanBackService, HuffmanDbService } from '../application';

/**
 * Encryption Module
 *
 * NestJS module that provides Huffman encryption services.
 * Exports HuffmanBackService and HuffmanDbService for use in other modules.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [EncryptionModule],
 *   providers: [DocumentService],
 * })
 * export class DocumentModule {}
 * ```
 */
@Module({
  imports: [ConfigModule],
  providers: [HuffmanBackService, HuffmanDbService],
  exports: [HuffmanBackService, HuffmanDbService],
})
export class EncryptionModule {}
