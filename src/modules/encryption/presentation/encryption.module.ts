import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { HuffmanBackService, HuffmanDbService, HuffmanFrontService } from '../application';
import { EncryptionController } from './encryption.controller';
import { DecryptionMiddleware } from './middleware/decryption.middleware';

/**
 * Encryption Module
 *
 * Provides Huffman encryption services and decryption middleware.
 */
@Module({
  imports: [],
  controllers: [EncryptionController],
  providers: [HuffmanBackService, HuffmanDbService, HuffmanFrontService],
  exports: [HuffmanBackService, HuffmanDbService, HuffmanFrontService],
})
export class EncryptionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DecryptionMiddleware).forRoutes('*');
  }
}
