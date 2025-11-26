/**
 * Huffman Encoder Interface
 *
 * Defines the contract for encoding text using Huffman compression.
 *
 * @remarks
 * This interface is framework-agnostic and can be used in both backend and frontend
 */
export interface IHuffmanEncoder {
  /**
   * Encodes a text string using Huffman compression
   *
   * @param text - The plain text to encode
   * @returns The encoded text in Base64 format
   *
   * @throws {Error} If the text contains characters not present in the Huffman tree
   *
   * @example
   * ```typescript
   * const encoder = new HuffmanEncoder(tree);
   * const encoded = encoder.encode("Hello World");
   * // Returns: "SGVsbG8gV29ybGQ=" (Base64)
   * ```
   */
  encode(text: string): string;

  /**
   * Encodes text to binary string (intermediate format)
   * Useful for debugging and testing
   *
   * @param text - The plain text to encode
   * @returns The binary representation as a string (e.g., "10110010...")
   */
  encodeToBinary(text: string): string;

  /**
   * Validates if the text can be encoded with the current tree
   *
   * @param text - The text to validate
   * @returns true if all characters are in the tree, false otherwise
   */
  canEncode(text: string): boolean;

  /**
   * Gets characters that cannot be encoded
   *
   * @param text - The text to check
   * @returns Array of characters not present in the Huffman tree
   */
  getUnencodableCharacters(text: string): string[];
}
