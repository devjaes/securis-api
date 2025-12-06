import { HuffmanNode } from '../../domain';
import { HuffmanEncoderAdapter } from '../../infrastructure';

/**
 * Encode Text Use Case
 *
 * Handles the business logic for encoding text using Huffman compression.
 * This use case encapsulates the encoding process and ensures proper error handling.
 *
 * @remarks
 * Following clean architecture, this use case is independent of frameworks.
 * It orchestrates the encoding process using the infrastructure adapters.
 *
 * @example
 * ```typescript
 * const useCase = new EncodeTextUseCase(huffmanTree);
 * const result = useCase.execute({ text: "Hello World" });
 * console.log(result.encodedText); // Base64 string
 * ```
 */
export class EncodeTextUseCase {
  private readonly encoder: HuffmanEncoderAdapter;

  constructor(private readonly tree: HuffmanNode) {
    this.encoder = new HuffmanEncoderAdapter(tree);
  }

  /**
   * Executes the encoding process
   *
   * @param input - The input containing text to encode
   * @returns Result with encoded text and metadata
   */
  execute(input: EncodeTextInput): EncodeTextOutput {
    try {
      // Validate input
      if (!input.text || input.text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      // Check if text can be encoded
      const unencodableChars = this.encoder.getUnencodableCharacters(input.text);
      if (unencodableChars.length > 0) {
        throw new Error(
          `Cannot encode text: the following characters are not supported: ${unencodableChars.join(', ')}`,
        );
      }

      // Perform encoding
      const encodedText = this.encoder.encode(input.text);
      const stats = this.encoder.getEncodingStats(input.text);

      return {
        success: true,
        encodedText,
        originalLength: input.text.length,
        encodedLength: encodedText.length,
        compressionRatio: stats.compressionRatio,
        spaceSavings: stats.spaceSavings,
      };
    } catch (error) {
      return {
        success: false,
        encodedText: '',
        originalLength: input.text.length,
        encodedLength: 0,
        compressionRatio: 0,
        spaceSavings: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validates if text can be encoded without actually encoding it
   */
  validate(text: string): EncodeValidationResult {
    const unencodableChars = this.encoder.getUnencodableCharacters(text);

    return {
      canEncode: unencodableChars.length === 0,
      unencodableCharacters: unencodableChars,
      message:
        unencodableChars.length > 0
          ? `Cannot encode: characters not supported: ${unencodableChars.join(', ')}`
          : 'Text can be encoded successfully',
    };
  }
}

export interface EncodeTextInput {
  text: string;
}

export interface EncodeTextOutput {
  success: boolean;
  encodedText: string;
  originalLength: number;
  encodedLength: number;
  compressionRatio: number;
  spaceSavings: number;
  error?: string;
}

export interface EncodeValidationResult {
  canEncode: boolean;
  unencodableCharacters: string[];
  message: string;
}
