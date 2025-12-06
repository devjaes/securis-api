import { HuffmanNode } from '../../domain'
import { HuffmanDecoderAdapter } from '../../infrastructure'

/**
 * Decode Text Use Case
 *
 * Handles the business logic for decoding Huffman-compressed text.
 * This use case encapsulates the decoding process and ensures proper error handling.
 *
 * @remarks
 * Following clean architecture, this use case is independent of frameworks.
 * It orchestrates the decoding process using the infrastructure adapters.
 *
 * @example
 * ```typescript
 * const useCase = new DecodeTextUseCase(huffmanTree);
 * const result = useCase.execute({ encodedText: "SGVsbG8gV29ybGQ=" });
 * console.log(result.decodedText); // "Hello World"
 * ```
 */
export class DecodeTextUseCase {
  private readonly decoder: HuffmanDecoderAdapter

  constructor(private readonly tree: HuffmanNode) {
    this.decoder = new HuffmanDecoderAdapter(tree)
  }

  /**
   * Executes the decoding process
   *
   * @param input - The input containing encoded text
   * @returns Result with decoded text and metadata
   */
  execute(input: DecodeTextInput): DecodeTextOutput {
    try {
      // Validate input
      if (!input.encodedText || input.encodedText.trim().length === 0) {
        throw new Error('Encoded text cannot be empty')
      }

      // Perform decoding
      const decodedText = this.decoder.decode(input.encodedText)
      const stats = this.decoder.getDecodingStats(input.encodedText)

      return {
        success: true,
        decodedText,
        encodedLength: input.encodedText.length,
        decodedLength: decodedText.length,
        compressionRatio: stats.compressionRatio,
        spaceSavings: stats.spaceSavings,
      }
    } catch (error) {
      return {
        success: false,
        decodedText: '',
        encodedLength: input.encodedText.length,
        decodedLength: 0,
        compressionRatio: 0,
        spaceSavings: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validates if encoded text can be decoded without actually decoding it
   */
  validate(encodedText: string): DecodeValidationResult {
    const canDecode = this.decoder.canDecode(encodedText)

    return {
      canDecode,
      message: canDecode
        ? 'Text can be decoded successfully'
        : 'Invalid or corrupted encoded text',
    }
  }
}

export interface DecodeTextInput {
  encodedText: string
}

export interface DecodeTextOutput {
  success: boolean
  decodedText: string
  encodedLength: number
  decodedLength: number
  compressionRatio: number
  spaceSavings: number
  error?: string
}

export interface DecodeValidationResult {
  canDecode: boolean
  message: string
}
