import { HuffmanNode } from '../entities/huffman-node.entity'

/**
 * Huffman Tree Interface
 *
 * Defines the contract for a Huffman tree structure.
 * This interface ensures consistency across different implementations.
 *
 * @remarks
 * This interface is framework-agnostic and can be implemented in any JavaScript/TypeScript environment
 */
export interface IHuffmanTree {
  /**
   * The root node of the Huffman tree
   */
  readonly root: HuffmanNode

  /**
   * Gets the Huffman code for a specific character
   * @param character - The character to get the code for
   * @returns The binary code string (e.g., "1010") or null if character not found
   */
  getCode(character: string): string | null

  /**
   * Gets all character codes as a mapping
   * @returns An object mapping characters to their binary codes
   */
  getCodeTable(): Record<string, string>

  /**
   * Decodes a binary string back to the original text
   * @param binaryString - The encoded binary string
   * @returns The decoded text
   */
  decode(binaryString: string): string

  /**
   * Serializes the tree to a JSON object
   */
  toJSON(): HuffmanTreeJSON
}

/**
 * JSON representation of a Huffman tree
 */
export interface HuffmanTreeJSON {
  root: {
    character: string | null
    frequency: number
    left: HuffmanTreeJSON['root'] | null
    right: HuffmanTreeJSON['root'] | null
  }
  codeTable: Record<string, string>
}
