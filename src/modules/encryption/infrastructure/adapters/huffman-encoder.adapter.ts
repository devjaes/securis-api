import { IHuffmanEncoder } from '../../domain'
import { HuffmanNode } from '../../domain/entities/huffman-node.entity'
import { BinaryToBase64Serializer } from '../serializers/binary-to-base64.serializer'
import { TreeSerializer } from '../serializers/tree-serializer'

/**
 * Huffman Encoder Adapter
 *
 * Implements the IHuffmanEncoder interface with the actual Huffman encoding logic.
 * Uses a pre-built Huffman tree to encode text efficiently.
 *
 * @remarks
 * This implementation is framework-agnostic and can be used in frontend.
 * For optimal compression, ensure the tree was built with character frequencies
 * similar to the text being encoded.
 *
 * @example
 * ```typescript
 * const tree = HuffmanNode.fromJSON(treeData);
 * const encoder = new HuffmanEncoderAdapter(tree);
 *
 * const encoded = encoder.encode("Hello World");
 * console.log(encoded); // Base64 string
 *
 * const binary = encoder.encodeToBinary("Hello");
 * console.log(binary); // "10110010..."
 * ```
 */
export class HuffmanEncoderAdapter implements IHuffmanEncoder {
  private readonly codeTable: Record<string, string>
  private readonly serializer: BinaryToBase64Serializer

  /**
   * @param tree - The Huffman tree root node to use for encoding
   */
  constructor(private readonly tree: HuffmanNode) {
    const treeSerializer = new TreeSerializer()

    // Special case: single-node tree
    if (tree.isLeaf()) {
      this.codeTable = tree.character ? { [tree.character]: '0' } : {}
    } else {
      this.codeTable = treeSerializer.buildCodeTable(tree)
    }

    this.serializer = new BinaryToBase64Serializer()
  }

  /**
   * Encodes text to Base64 using Huffman compression
   */
  encode(text: string): string {
    if (!text || text.length === 0) {
      throw new Error('Cannot encode empty text')
    }

    const binaryString = this.encodeToBinary(text)
    return this.serializer.binaryToBase64(binaryString)
  }

  /**
   * Encodes text to binary string (intermediate format)
   */
  encodeToBinary(text: string): string {
    if (!text || text.length === 0) {
      throw new Error('Cannot encode empty text')
    }

    // Check if all characters can be encoded
    const unencodable = this.getUnencodableCharacters(text)
    if (unencodable.length > 0) {
      throw new Error(
        `Cannot encode text: characters not in tree: ${unencodable.join(', ')}`,
      )
    }

    let binaryString = ''

    for (const char of text) {
      const code = this.codeTable[char]
      if (!code) {
        throw new Error(`Character '${char}' not found in Huffman tree`)
      }
      binaryString += code
    }

    return binaryString
  }

  /**
   * Checks if text can be encoded with current tree
   */
  canEncode(text: string): boolean {
    return this.getUnencodableCharacters(text).length === 0
  }

  /**
   * Gets characters that cannot be encoded
   */
  getUnencodableCharacters(text: string): string[] {
    const uniqueChars = new Set<string>(text)
    const unencodable: string[] = []

    for (const char of uniqueChars) {
      if (!this.codeTable[char]) {
        unencodable.push(char)
      }
    }

    return unencodable
  }

  /**
   * Gets the code table used for encoding
   * Useful for debugging
   */
  getCodeTable(): Readonly<Record<string, string>> {
    return { ...this.codeTable }
  }

  /**
   * Gets encoding statistics for a text
   */
  getEncodingStats(text: string): EncodingStats {
    const originalBits = text.length * 16 // UTF-16 uses 2 bytes per char
    const binaryString = this.encodeToBinary(text)
    const compressedBits = binaryString.length

    // After Base64 encoding, each 6 bits becomes 8 bits (1 character)
    const base64Length = Math.ceil(compressedBits / 6)
    const base64Bits = base64Length * 8

    return {
      originalLength: text.length,
      originalBits,
      compressedBits,
      base64Bits,
      compressionRatio: compressedBits / originalBits,
      spaceSavings: ((originalBits - compressedBits) / originalBits) * 100,
    }
  }
}

/**
 * Encoding statistics
 */
export interface EncodingStats {
  originalLength: number
  originalBits: number
  compressedBits: number
  base64Bits: number
  compressionRatio: number
  spaceSavings: number
}
