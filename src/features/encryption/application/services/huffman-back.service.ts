import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HuffmanNode } from '../../domain';
import { TreeFileLoaderAdapter } from '../../infrastructure';
import { EncodeTextUseCase } from '../use-cases/encode-text.use-case';
import { DecodeTextUseCase } from '../use-cases/decode-text.use-case';

/**
 * Huffman Backend Service
 *
 * NestJS injectable service that provides Huffman encryption/decryption
 * for the backend layer using the backend-specific Huffman tree.
 *
 * @remarks
 * This service loads the Huffman tree on module initialization and
 * provides encode/decode methods for use throughout the application.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class DocumentService {
 *   constructor(private huffmanBack: HuffmanBackService) {}
 *
 *   async createDocument(content: string) {
 *     const encrypted = await this.huffmanBack.encode(content);
 *     // ... save to database
 *   }
 * }
 * ```
 */
@Injectable()
export class HuffmanBackService implements OnModuleInit {
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
      'HUFFMAN_TREE_BACK_PATH',
      'src/features/encryption/trees/huffman-back.tree.json',
    );

    try {
      this.tree = await this.treeLoader.loadTree(treePath);
      this.encodeUseCase = new EncodeTextUseCase(this.tree);
      this.decodeUseCase = new DecodeTextUseCase(this.tree);
    } catch (error) {
      throw new Error(
        `Failed to load Huffman backend tree from ${treePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Encodes text using Huffman compression
   *
   * @param text - Plain text to encode
   * @returns Base64-encoded compressed text
   * @throws {Error} If tree is not loaded or text contains unsupported characters
   */
  encode(text: string): string {
    this.ensureTreeLoaded();

    const result = this.encodeUseCase!.execute({ text });

    if (!result.success) {
      throw new Error(`Encoding failed: ${result.error}`);
    }

    return result.encodedText;
  }

  /**
   * Decodes Huffman-compressed text
   *
   * @param encodedText - Base64-encoded compressed text
   * @returns Original plain text
   * @throws {Error} If tree is not loaded or encoded text is invalid
   */
  decode(encodedText: string): string {
    this.ensureTreeLoaded();

    const result = this.decodeUseCase!.execute({ encodedText });

    if (!result.success) {
      throw new Error(`Decoding failed: ${result.error}`);
    }

    return result.decodedText;
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

  /**
   * Gets compression statistics for a text
   */
  getCompressionStats(text: string): CompressionStats {
    this.ensureTreeLoaded();

    const result = this.encodeUseCase!.execute({ text });

    if (!result.success) {
      throw new Error(`Failed to get stats: ${result.error}`);
    }

    return {
      originalLength: result.originalLength,
      encodedLength: result.encodedLength,
      compressionRatio: result.compressionRatio,
      spaceSavings: result.spaceSavings,
    };
  }

  private ensureTreeLoaded(): void {
    if (!this.tree || !this.encodeUseCase || !this.decodeUseCase) {
      throw new Error('Huffman tree not loaded. Service not initialized properly.');
    }
  }
}

export interface CompressionStats {
  originalLength: number;
  encodedLength: number;
  compressionRatio: number;
  spaceSavings: number;
}
