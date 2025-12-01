import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HuffmanNode } from '../../domain';
import { TreeFileLoaderAdapter } from '../../infrastructure';
import { EncodeTextUseCase } from '../use-cases/encode-text.use-case';
import { DecodeTextUseCase } from '../use-cases/decode-text.use-case';

/**
 * Huffman Database Service
 *
 * NestJS injectable service that provides Huffman encryption/decryption
 * for the database layer using the database-specific Huffman tree.
 *
 * @remarks
 * This service is used to encrypt sensitive columns before storing in the database
 * and decrypt them when reading. It uses a different tree than the backend service
 * to provide an additional layer of security.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserRepository {
 *   constructor(private huffmanDb: HuffmanDbService) {}
 *
 *   async saveUser(email: string) {
 *     const encryptedEmail = await this.huffmanDb.encode(email);
 *     // ... save to database
 *   }
 * }
 * ```
 */
@Injectable()
export class HuffmanDbService implements OnModuleInit {
  private tree: HuffmanNode | null = null;
  private encodeUseCase: EncodeTextUseCase | null = null;
  private decodeUseCase: DecodeTextUseCase | null = null;
  private readonly treeLoader: TreeFileLoaderAdapter;

  constructor(private readonly configService: ConfigService) {
    this.treeLoader = new TreeFileLoaderAdapter();
  }

  /**
   * Loads the Huffman tree when the module initializes
   */
  async onModuleInit() {
    await this.loadTree();
  }

  /**
   * Loads or reloads the Huffman tree from the configured path
   */
  private async loadTree(): Promise<void> {
    const treePath = this.configService.get<string>(
      'HUFFMAN_TREE_DB_PATH',
      'src/features/encryption/trees/huffman-db.tree.json',
    );

    try {
      this.tree = await this.treeLoader.loadTree(treePath);
      this.encodeUseCase = new EncodeTextUseCase(this.tree);
      this.decodeUseCase = new DecodeTextUseCase(this.tree);
    } catch (error) {
      throw new Error(
        `Failed to load Huffman database tree from ${treePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Encodes text using Huffman compression (for database storage)
   *
   * @param text - Plain text to encode
   * @returns Base64-encoded compressed text
   * @throws {Error} If tree is not loaded or text contains unsupported characters
   */
  encode(text: string): string {
    this.ensureTreeLoaded();

    const result = this.encodeUseCase!.execute({ text });

    if (!result.success) {
      throw new Error(`Database encoding failed: ${result.error}`);
    }

    return result.encodedText;
  }

  /**
   * Decodes Huffman-compressed text (from database storage)
   *
   * @param encodedText - Base64-encoded compressed text
   * @returns Original plain text
   * @throws {Error} If tree is not loaded or encoded text is invalid
   */
  decode(encodedText: string): string {
    this.ensureTreeLoaded();

    const result = this.decodeUseCase!.execute({ encodedText });

    if (!result.success) {
      throw new Error(`Database decoding failed: ${result.error}`);
    }

    return result.decodedText;
  }

  /**
   * Encodes multiple fields at once (batch operation)
   * Useful for encrypting multiple columns in a single row
   */
  encodeMultiple(fields: Record<string, string>): Record<string, string> {
    const encoded: Record<string, string> = {};

    for (const [key, value] of Object.entries(fields)) {
      encoded[key] = this.encode(value);
    }

    return encoded;
  }

  /**
   * Decodes multiple fields at once (batch operation)
   */
  decodeMultiple(fields: Record<string, string>): Record<string, string> {
    const decoded: Record<string, string> = {};

    for (const [key, value] of Object.entries(fields)) {
      decoded[key] = this.decode(value);
    }

    return decoded;
  }

  /**
   * Validates if text can be encoded
   */
  canEncode(text: string): boolean {
    this.ensureTreeLoaded();
    const validation = this.encodeUseCase!.validate(text);
    return validation.canEncode;
  }

  /**
   * Validates if encoded text can be decoded
   */
  canDecode(encodedText: string): boolean {
    this.ensureTreeLoaded();
    const validation = this.decodeUseCase!.validate(encodedText);
    return validation.canDecode;
  }

  private ensureTreeLoaded(): void {
    if (!this.tree || !this.encodeUseCase || !this.decodeUseCase) {
      throw new Error('Huffman tree not loaded. Service not initialized properly.');
    }
  }
}
