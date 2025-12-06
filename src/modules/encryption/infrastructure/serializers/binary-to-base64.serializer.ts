/**
 * Binary to Base64 Serializer
 *
 * Handles conversion between binary strings and Base64 encoding.
 * This is necessary because Huffman encoding produces bit strings,
 * but we need to store/transmit them as compact Base64 strings.
 *
 * @remarks
 * - Binary strings are padded to byte boundaries (8 bits)
 * - Padding length is stored in the first byte of the output
 * - This implementation is framework-agnostic and can be used in frontend
 *
 * @example
 * ```typescript
 * const serializer = new BinaryToBase64Serializer();
 * const base64 = serializer.binaryToBase64("10110010"); // "sgI="
 * const binary = serializer.base64ToBinary("sgI="); // "10110010"
 * ```
 */
export class BinaryToBase64Serializer {
  /**
   * Converts a binary string to Base64
   *
   * @param binaryString - String of 0s and 1s (e.g., "10110010")
   * @returns Base64-encoded string
   *
   * @example
   * ```typescript
   * binaryToBase64("10110010") // Returns: "sgI="
   * ```
   */
  binaryToBase64(binaryString: string): string {
    if (!binaryString || binaryString.length === 0) {
      throw new Error('Binary string cannot be empty')
    }

    if (!/^[01]+$/.test(binaryString)) {
      throw new Error('Binary string must contain only 0s and 1s')
    }

    // Calculate padding needed to reach byte boundary
    const paddingLength = (8 - (binaryString.length % 8)) % 8
    const paddedBinary = binaryString + '0'.repeat(paddingLength)

    // Convert binary to bytes
    const bytes: number[] = []

    // First byte stores the padding length (0-7)
    bytes.push(paddingLength)

    // Convert each 8-bit chunk to a byte
    for (let i = 0; i < paddedBinary.length; i += 8) {
      const byte = paddedBinary.substring(i, i + 8)
      bytes.push(parseInt(byte, 2))
    }

    // Convert bytes to Base64
    const buffer = Buffer.from(bytes)
    return buffer.toString('base64')
  }

  /**
   * Converts a Base64 string back to binary
   *
   * @param base64String - Base64-encoded string
   * @returns Original binary string (0s and 1s)
   *
   * @example
   * ```typescript
   * base64ToBinary("sgI=") // Returns: "10110010"
   * ```
   */
  base64ToBinary(base64String: string): string {
    if (!base64String || base64String.length === 0) {
      throw new Error('Base64 string cannot be empty')
    }

    try {
      // Decode Base64 to bytes
      const buffer = Buffer.from(base64String, 'base64')
      const bytes = Array.from(buffer)

      if (bytes.length < 1) {
        throw new Error('Invalid Base64 string: too short')
      }

      // First byte contains the padding length
      const paddingLength = bytes[0]

      if (paddingLength > 7) {
        throw new Error('Invalid padding length in encoded data')
      }

      // Convert remaining bytes to binary
      let binaryString = ''
      for (let i = 1; i < bytes.length; i++) {
        const byte = bytes[i]
        binaryString += byte.toString(2).padStart(8, '0')
      }

      // Remove padding from the end
      if (paddingLength > 0) {
        binaryString = binaryString.substring(
          0,
          binaryString.length - paddingLength,
        )
      }

      return binaryString
    } catch (error) {
      throw new Error(
        `Failed to decode Base64: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Validates if a string is valid Base64
   *
   * @param str - String to validate
   * @returns true if valid Base64, false otherwise
   */
  isValidBase64(str: string): boolean {
    try {
      const decoded = Buffer.from(str, 'base64').toString('base64')
      return decoded === str
    } catch {
      return false
    }
  }

  /**
   * Validates if a string is valid binary (only 0s and 1s)
   *
   * @param str - String to validate
   * @returns true if valid binary, false otherwise
   */
  isValidBinary(str: string): boolean {
    return /^[01]+$/.test(str)
  }
}
