import { HuffmanNode, FrequencyMap } from '../../domain'

/**
 * Huffman Tree Generator
 *
 * Generates optimal Huffman trees from frequency maps.
 * Implements the classic Huffman algorithm using a min-heap.
 *
 * @remarks
 * This implementation is framework-agnostic and can be used in frontend.
 * The algorithm:
 * 1. Creates leaf nodes for each character with its frequency
 * 2. Builds a min-heap from these nodes
 * 3. Repeatedly extracts two minimum nodes and combines them
 * 4. Continues until only one node (the root) remains
 *
 * @example
 * ```typescript
 * const generator = new HuffmanTreeGenerator();
 *
 * // From text
 * const tree1 = generator.generateFromText("hello world");
 *
 * // From frequency map
 * const freqMap = FrequencyMap.fromText("hello world");
 * const tree2 = generator.generateFromFrequencyMap(freqMap);
 *
 * // Generate different trees with randomization
 * const tree3 = generator.generateWithRandomization(freqMap, 0.1);
 * ```
 */
export class HuffmanTreeGenerator {
  /**
   * Generates a Huffman tree from plain text
   *
   * @param text - The text to analyze and build tree from
   * @returns Root node of the generated Huffman tree
   */
  generateFromText(text: string): HuffmanNode {
    const frequencyMap = FrequencyMap.fromText(text)
    return this.generateFromFrequencyMap(frequencyMap)
  }

  /**
   * Generates a Huffman tree from a frequency map
   *
   * @param frequencyMap - Map of characters to their frequencies
   * @returns Root node of the generated Huffman tree
   */
  generateFromFrequencyMap(frequencyMap: FrequencyMap): HuffmanNode {
    const entries = frequencyMap.getEntries()

    if (entries.length === 0) {
      throw new Error('Cannot generate tree from empty frequency map')
    }

    // Edge case: single character
    if (entries.length === 1) {
      const [char, freq] = entries[0]
      return new HuffmanNode(char, freq)
    }

    // Create leaf nodes for each character
    const heap = new MinHeap<HuffmanNode>((a, b) => a.compareTo(b))

    for (const [char, freq] of entries) {
      heap.insert(new HuffmanNode(char, freq))
    }

    // Build the tree bottom-up
    while (heap.size() > 1) {
      const left = heap.extractMin()!
      const right = heap.extractMin()!

      // Create internal node with combined frequency
      const parent = new HuffmanNode(
        null,
        left.frequency + right.frequency,
        left,
        right,
      )

      heap.insert(parent)
    }

    const root = heap.extractMin()
    if (!root) {
      throw new Error('Failed to generate tree: heap is empty')
    }

    return root
  }

  /**
   * Generates a Huffman tree with slight randomization in frequencies
   * This creates different trees for the same character set
   *
   * @param frequencyMap - Base frequency map
   * @param randomizationFactor - Amount of randomization (0.0 to 1.0)
   * @returns Root node of the generated Huffman tree
   *
   * @remarks
   * Used to generate the 3 different trees required for backend, frontend, and database.
   * A factor of 0.1 means frequencies can vary by ±10%
   */
  generateWithRandomization(
    frequencyMap: FrequencyMap,
    randomizationFactor: number = 0.1,
  ): HuffmanNode {
    if (randomizationFactor < 0 || randomizationFactor > 1) {
      throw new Error('Randomization factor must be between 0 and 1')
    }

    const entries = frequencyMap.getEntries()
    const randomizedEntries: Array<[string, number]> = []

    for (const [char, freq] of entries) {
      // Add random variation to frequency with additional entropy
      const variation = freq * randomizationFactor
      // Use timestamp-based seed for additional randomness
      const seed = Math.sin(Date.now() * Math.random()) * 10000
      const randomDelta = (Math.random() + Math.abs(seed % 1) - 1) * variation
      const newFreq = Math.max(1, Math.round(freq + randomDelta))

      randomizedEntries.push([char, newFreq])
    }

    const randomizedMap = FrequencyMap.fromObject(
      Object.fromEntries(randomizedEntries),
    )

    return this.generateFromFrequencyMap(randomizedMap)
  }

  /**
   * Generates a default tree using common Spanish/UTF-8 characters
   */
  generateDefaultTree(): HuffmanNode {
    const defaultMap = FrequencyMap.createDefault()
    return this.generateFromFrequencyMap(defaultMap)
  }

  /**
   * Generates three different trees for backend, frontend, and database
   * Each tree has the same character set but different structure
   *
   * @param baseFrequencyMap - Base frequency map to use
   * @param randomizationFactor - Amount of variation between trees
   * @returns Object with three different trees
   */
  generateThreeTrees(
    baseFrequencyMap?: FrequencyMap,
    randomizationFactor: number = 0.15,
  ): ThreeTreesResult {
    const baseMap = baseFrequencyMap || FrequencyMap.createDefault()

    return {
      backendTree: this.generateWithRandomization(baseMap, randomizationFactor),
      frontendTree: this.generateWithRandomization(
        baseMap,
        randomizationFactor,
      ),
      databaseTree: this.generateWithRandomization(
        baseMap,
        randomizationFactor,
      ),
    }
  }
}

/**
 * Min Heap implementation for Huffman algorithm
 *
 * @remarks
 * This is a generic min-heap that can be used with any comparable type.
 * Used internally by HuffmanTreeGenerator.
 */
class MinHeap<T> {
  private items: T[] = []

  constructor(private compareFn: (a: T, b: T) => number) {}

  size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  insert(item: T): void {
    this.items.push(item)
    this.bubbleUp(this.items.length - 1)
  }

  extractMin(): T | undefined {
    if (this.isEmpty()) {
      return undefined
    }

    const min = this.items[0]
    const last = this.items.pop()!

    if (!this.isEmpty()) {
      this.items[0] = last
      this.bubbleDown(0)
    }

    return min
  }

  peek(): T | undefined {
    return this.items[0]
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)

      if (this.compareFn(this.items[index], this.items[parentIndex]) >= 0) {
        break
      }

      this.swap(index, parentIndex)
      index = parentIndex
    }
  }

  private bubbleDown(index: number): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2
      let smallest = index

      if (
        leftChild < this.items.length &&
        this.compareFn(this.items[leftChild], this.items[smallest]) < 0
      ) {
        smallest = leftChild
      }

      if (
        rightChild < this.items.length &&
        this.compareFn(this.items[rightChild], this.items[smallest]) < 0
      ) {
        smallest = rightChild
      }

      if (smallest === index) {
        break
      }

      this.swap(index, smallest)
      index = smallest
    }
  }

  private swap(i: number, j: number): void {
    ;[this.items[i], this.items[j]] = [this.items[j], this.items[i]]
  }
}

/**
 * Result of generating three trees
 */
export interface ThreeTreesResult {
  backendTree: HuffmanNode
  frontendTree: HuffmanNode
  databaseTree: HuffmanNode
}
