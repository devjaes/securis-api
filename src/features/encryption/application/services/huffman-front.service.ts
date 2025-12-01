import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HuffmanNode } from '../../domain';
import { TreeFileLoaderAdapter } from '../../infrastructure';
import { EncodeTextUseCase } from '../use-cases/encode-text.use-case';
import { DecodeTextUseCase } from '../use-cases/decode-text.use-case';

/**
 * Huffman Frontend Service
 *
 * Decodes requests from the frontend using the frontend Huffman tree.
 */
@Injectable()
export class HuffmanFrontService implements OnModuleInit {
  private tree: HuffmanNode | null = null;
  private encodeUseCase: EncodeTextUseCase | null = null;
  private decodeUseCase: DecodeTextUseCase | null = null;
  private readonly treeLoader: TreeFileLoaderAdapter;

  constructor(private readonly configService: ConfigService) {
    this.treeLoader = new TreeFileLoaderAdapter();
  }

  async onModuleInit() {
    await this.loadTree();
  }

  private async loadTree(): Promise<void> {
    const treePath = this.configService.get<string>(
      'HUFFMAN_TREE_FRONT_PATH',
      'src/features/encryption/trees/huffman-front.tree.json',
    );

    try {
      this.tree = await this.treeLoader.loadTree(treePath);
      this.encodeUseCase = new EncodeTextUseCase(this.tree);
      this.decodeUseCase = new DecodeTextUseCase(this.tree);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load Huffman frontend tree from ${treePath}: ${errorMessage}`);
    }
  }

  decode(encodedText: string): string {
    this.ensureTreeLoaded();
    const result = this.decodeUseCase!.execute({ encodedText });

    if (!result.success) {
      throw new Error(`Frontend decoding failed: ${result.error}`);
    }

    return result.decodedText;
  }

  encode(text: string): string {
    this.ensureTreeLoaded();
    const result = this.encodeUseCase!.execute({ text });

    if (!result.success) {
      throw new Error(`Frontend encoding failed: ${result.error}`);
    }

    return result.encodedText;
  }

  private ensureTreeLoaded(): void {
    if (!this.tree || !this.encodeUseCase || !this.decodeUseCase) {
      throw new Error('Huffman frontend tree not loaded. Service not initialized properly.');
    }
  }
}
