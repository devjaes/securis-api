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
      // eslint-disable-next-line quotes
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
      // Caracteres Unicode comunes que pueden aparecer en JSON/datos
      Ã: 5, // Carácter UTF-8 mal interpretado común
      '³': 3, // Superíndice 3
      '²': 2, // Superíndice 2
      '¹': 1, // Superíndice 1
      '°': 2, // Grado
      º: 2, // Ordinal masculino
      ª: 1, // Ordinal femenino
      // Más caracteres especiales comunes
      '€': 3,
      '£': 2,
      '¥': 2,
      '©': 1,
      '®': 1,
      '™': 1,
      '§': 2,
      '¶': 1,
      '•': 2,
      '…': 2,
      '–': 3, // En dash
      '—': 2, // Em dash
      '«': 2, // Comillas francesas
      '»': 2,
      '„': 1, // Comillas alemanas
      '‚': 1,
      '‹': 1,
      '›': 1,
      // Caracteres de escape y control comunes en JSON
      '\r': 5, // Carriage return
      '\f': 2, // Form feed
      '\b': 1, // Backspace
      // Más símbolos matemáticos
      '±': 2,
      '×': 2,
      '÷': 2,
      '≤': 1,
      '≥': 1,
      '≠': 1,
      '≈': 1,
      '∞': 1,
      '∑': 1,
      '∏': 1,
      '√': 1,
      '∫': 1,
      '∆': 1,
      '∇': 1,
      α: 1,
      β: 1,
      γ: 1,
      π: 1,
      Ω: 1,
      // Caracteres de codificación UTF-8 comunes (bytes mal interpretados)
      Â: 2,
      Ê: 1,
      Î: 1,
      Ô: 1,
      Û: 1,
      ã: 3,
      õ: 2,
      ç: 3,
      Ç: 1,
      // Más acentos y diacríticos
      à: 3,
      è: 3,
      ì: 2,
      ò: 2,
      ù: 2,
      À: 1,
      È: 1,
      Ì: 1,
      Ò: 1,
      Ù: 1,
      â: 2,
      ê: 2,
      î: 1,
      ô: 2,
      û: 1,
      ä: 2,
      ë: 1,
      ï: 1,
      ö: 2,
      Ä: 1,
      Ë: 1,
      Ï: 1,
      Ö: 1,
      å: 1,
      Å: 1,
      æ: 1,
      Æ: 1,
      ø: 1,
      Ø: 1,
      ß: 1,
      // Caracteres de puntuación adicionales
      '`': 3, // Backtick
      '~': 4, // Tilde
      '^': 2, // Caret
      // Caracteres de control y espacios
      '\u00A0': 5, // Non-breaking space
      '\u2000': 1, // En quad
      '\u2001': 1, // Em quad
      '\u2002': 1, // En space
      '\u2003': 1, // Em space
      '\u2009': 2, // Thin space
      '\u2028': 1, // Line separator
      '\u2029': 1, // Paragraph separator
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
