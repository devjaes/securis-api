import { IHuffmanDecoder } from '../../domain'
import { HuffmanNode } from '../../domain/entities/huffman-node.entity'
import { BinaryToBase64Serializer } from '../serializers/binary-to-base64.serializer'

/**
 * Huffman Decoder Adapter
 *
 * Implements the IHuffmanDecoder interface with the actual Huffman decoding logic.
 * Uses a Huffman tree to decode compressed binary data back to original text.
 *
 * @remarks
 * This implementation is framework-agnostic and can be used in frontend.
 * The tree used for decoding MUST be the same one used for encoding.
 *
 * @example
 * ```typescript
 * const tree = HuffmanNode.fromJSON(treeData);
 * const decoder = new HuffmanDecoderAdapter(tree);
 *
 * const decoded = decoder.decode("SGVsbG8gV29ybGQ=");
 * console.log(decoded); // "Hello World"
 * ```
 */
export class HuffmanDecoderAdapter implements IHuffmanDecoder {
  private readonly serializer: BinaryToBase64Serializer

  /**
   * @param tree - The Huffman tree root node to use for decoding
   */
  constructor(private readonly tree: HuffmanNode) {
    this.serializer = new BinaryToBase64Serializer()
  }

  /**
   * Decodes a Base64-encoded Huffman string back to plain text
   */
  decode(encodedText: string): string {
    if (!encodedText || encodedText.length === 0) {
      throw new Error('Cannot decode empty text')
    }

    if (!this.serializer.isValidBase64(encodedText)) {
      throw new Error('Invalid Base64 string')
    }

    const binaryString = this.serializer.base64ToBinary(encodedText)
    return this.decodeFromBinary(binaryString)
  }

  /**
   * Decodes from binary string (intermediate format)
   */
  decodeFromBinary(binaryString: string): string {
    if (!binaryString || binaryString.length === 0) {
      throw new Error('Cannot decode empty binary string')
    }

    if (!this.serializer.isValidBinary(binaryString)) {
      throw new Error('Invalid binary string: must contain only 0s and 1s')
    }

    // Special case: single-node tree (only one unique character)
    if (this.tree.isLeaf()) {
      if (this.tree.character === null) {
        throw new Error('Single-node tree has null character')
      }
      // Each bit represents one character occurrence
      const characterCount = binaryString.length
      return this.tree.character.repeat(characterCount)
    }

    let decodedText = ''
    let currentNode = this.tree
    let position = 0

    while (position < binaryString.length) {
      const bit = binaryString[position]

      if (bit === '0') {
        if (currentNode.left === null) {
          throw new Error(
            `Invalid encoding: expected left child at position ${position}`,
          )
        }
        currentNode = currentNode.left
      } else if (bit === '1') {
        if (currentNode.right === null) {
          throw new Error(
            `Invalid encoding: expected right child at position ${position}`,
          )
        }
        currentNode = currentNode.right
      } else {
        throw new Error(`Invalid bit at position ${position}: ${bit}`)
      }

      if (currentNode.isLeaf()) {
        if (currentNode.character === null) {
          throw new Error('Leaf node has null character')
        }

        decodedText += currentNode.character
        currentNode = this.tree
      }

      position++
    }

    if (currentNode !== this.tree) {
      throw new Error(
        'Invalid encoding: binary string does not represent complete characters',
      )
    }

    return decodedText
  }

  /**
   * Validates if encoded text can be decoded
   */
  canDecode(encodedText: string): boolean {
    try {
      this.decode(encodedText)
      return true
    } catch {
      return false
    }
  }

  /**
   * Attempts to decode and returns result with error information
   * Useful for debugging
   */
  tryDecode(encodedText: string): DecodeResult {
    try {
      const decoded = this.decode(encodedText)
      return {
        success: true,
        data: decoded,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Gets decoding statistics
   */
  getDecodingStats(encodedText: string): DecodingStats {
    const binaryString = this.serializer.base64ToBinary(encodedText)
    const decodedText = this.decodeFromBinary(binaryString)

    const base64Length = encodedText.length
    const base64Bits = base64Length * 8
    const compressedBits = binaryString.length
    const originalBits = decodedText.length * 16

    return {
      encodedLength: encodedText.length,
      decodedLength: decodedText.length,
      base64Bits,
      compressedBits,
      originalBits,
      compressionRatio: compressedBits / originalBits,
      spaceSavings: ((originalBits - compressedBits) / originalBits) * 100,
    }
  }
}

/**
 * Result of a decode attempt
 */
export interface DecodeResult {
  success: boolean
  data: string | null
  error: string | null
}

/**
 * Decoding statistics
 */
export interface DecodingStats {
  encodedLength: number
  decodedLength: number
  base64Bits: number
  compressedBits: number
  originalBits: number
  compressionRatio: number
  spaceSavings: number
}
