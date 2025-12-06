/**
 * Huffman Decoder Interface
 *
 * Defines the contract for decoding Huffman-compressed text.
 *
 * @remarks
 * This interface is framework-agnostic and can be used in both backend and frontend
 */
export interface IHuffmanDecoder {
  /**
   * Decodes a Base64-encoded Huffman string back to plain text
   *
   * @param encodedText - The Base64-encoded text
   * @returns The original plain text
   *
   * @throws {Error} If the encoded text is invalid or corrupted
   *
   * @example
   * ```typescript
   * const decoder = new HuffmanDecoder(tree);
   * const decoded = decoder.decode("SGVsbG8gV29ybGQ=");
   * // Returns: "Hello World"
   * ```
   */
  decode(encodedText: string): string;

  /**
   * Decodes from binary string (intermediate format)
   * Useful for debugging and testing
   *
   * @param binaryString - The binary representation (e.g., "10110010...")
   * @returns The original plain text
   *
   * @throws {Error} If the binary string doesn't represent a valid encoding
   */
  decodeFromBinary(binaryString: string): string;

  /**
   * Validates if the encoded text can be decoded
   *
   * @param encodedText - The Base64-encoded text to validate
   * @returns true if the text appears to be valid, false otherwise
   */
  canDecode(encodedText: string): boolean;
}
