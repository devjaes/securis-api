/**
 * Frequency Map Value Object
 *
 * Represents the character frequency mapping used to build Huffman trees.
 * Ensures that frequency counts are always valid and provides utility methods.
 *
 * @remarks
 * This is a Value Object following DDD principles - immutable and self-validating.
 * Can be reused in frontend implementations.
 *
 * @example
 * ```typescript
 * const text = "hello world";
 * const freqMap = FrequencyMap.fromText(text);
 * console.log(freqMap.getFrequency('l')); // 3
 * console.log(freqMap.getMostFrequent()); // 'l'
 * ```
 */
export class FrequencyMap {
  private readonly frequencies: Map<string, number>

  private constructor(frequencies: Map<string, number>) {
    this.frequencies = new Map(frequencies)
  }

  /**
   * Creates a FrequencyMap from a text string
   * Analyzes the text and counts character occurrences
   */
  static fromText(text: string): FrequencyMap {
    const frequencies = new Map<string, number>()

    for (const char of text) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1)
    }

    if (frequencies.size === 0) {
      throw new Error('Cannot create FrequencyMap from empty text')
    }

    return new FrequencyMap(frequencies)
  }

  /**
   * Creates a FrequencyMap from a pre-computed frequency object
   */
  static fromObject(obj: Record<string, number>): FrequencyMap {
    const frequencies = new Map<string, number>(Object.entries(obj))

    if (frequencies.size === 0) {
      throw new Error('Cannot create FrequencyMap from empty object')
    }

    return new FrequencyMap(frequencies)
  }

  /**
   * Creates a FrequencyMap with default UTF-8 character frequencies
   * Useful for generating generic Huffman trees
   */
  static createDefault(): FrequencyMap {
    const defaultFrequencies: Record<string, number> = {
      // Lowercase vowels (higher frequency)
      a: 150,
      e: 140,
      i: 80,
      o: 110,
      u: 50,
      // Uppercase vowels
      A: 30,
      E: 28,
      I: 20,
      O: 25,
      U: 15,
      // Spanish accented lowercase vowels
      á: 20,
      é: 25,
      í: 15,
      ó: 18,
      ú: 12,
      // Spanish accented uppercase vowels
      Á: 8,
      É: 10,
      Í: 6,
      Ó: 7,
      Ú: 5,
      // Spanish special characters
      ñ: 10,
      Ñ: 4,
      ü: 5,
      Ü: 2,
      // Lowercase consonants
      n: 70,
      s: 75,
      r: 65,
      l: 60,
      d: 55,
      c: 50,
      t: 48,
      m: 45,
      p: 40,
      b: 35,
      v: 30,
      g: 28,
      h: 25,
      f: 22,
      q: 18,
      j: 15,
      z: 12,
      x: 8,
      y: 10,
      w: 5,
      k: 3,
      // Uppercase consonants
      N: 18,
      S: 20,
      R: 16,
      L: 15,
      D: 14,
      C: 13,
      T: 12,
      M: 11,
      P: 10,
      B: 9,
      V: 8,
      G: 7,
      H: 6,
      F: 5,
      Q: 4,
      J: 4,
      Z: 3,
      X: 2,
      Y: 3,
      W: 2,
      K: 1,
      // Space and punctuation
      ' ': 200,
      '.': 30,
      ',': 35,
      ';': 8,
      ':': 10,
      '?': 12,
      '¿': 12,
      '!': 10,
      '¡': 10,
      '-': 15,
      _: 8,
      '"': 12,
      "'": 10,
      '(': 8,
      ')': 8,
      '\n': 20,
      '\t': 5,
      // Numbers
      '0': 10,
      '1': 12,
      '2': 11,
      '3': 10,
      '4': 9,
      '5': 9,
      '6': 8,
      '7': 8,
      '8': 7,
      '9': 7,
      // Common symbols
      '@': 8,
      '#': 5,
      $: 6,
      '%': 5,
      '&': 4,
      '*': 5,
      '+': 6,
      '=': 7,
      '/': 10,
      '\\': 5,
      '|': 3,
      '<': 5,
      '>': 5,
      '[': 4,
      ']': 4,
      '{': 4,
      '}': 4,
    }

    return FrequencyMap.fromObject(defaultFrequencies)
  }

  /**
   * Gets the frequency of a specific character
   */
  getFrequency(char: string): number {
    return this.frequencies.get(char) || 0
  }

  /**
   * Gets all unique characters
   */
  getCharacters(): string[] {
    return Array.from(this.frequencies.keys())
  }

  /**
   * Gets the total number of unique characters
   */
  getSize(): number {
    return this.frequencies.size
  }

  /**
   * Gets the most frequent character
   */
  getMostFrequent(): string | null {
    let maxChar: string | null = null
    let maxFreq = 0

    for (const [char, freq] of this.frequencies.entries()) {
      if (freq > maxFreq) {
        maxFreq = freq
        maxChar = char
      }
    }

    return maxChar
  }

  /**
   * Converts the frequency map to a plain object
   */
  toObject(): Record<string, number> {
    return Object.fromEntries(this.frequencies)
  }

  /**
   * Gets all entries as an array of [character, frequency] pairs
   */
  getEntries(): Array<[string, number]> {
    return Array.from(this.frequencies.entries())
  }

  /**
   * Creates a copy of this FrequencyMap
   */
  clone(): FrequencyMap {
    return new FrequencyMap(this.frequencies)
  }
}
