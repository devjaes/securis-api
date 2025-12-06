/**
 * Huffman Tree Node Entity
 *
 * Represents a node in the Huffman tree structure.
 * Can be either a leaf node (with a character) or an internal node (with children).
 *
 * @remarks
 * This implementation is framework-agnostic and follows clean architecture principles.
 * It can be reused in frontend implementations (Vue.js, React, etc.)
 *
 * @example
 * ```typescript
 * // Leaf node
 * const leafNode = new HuffmanNode('a', 5);
 *
 * // Internal node
 * const internalNode = new HuffmanNode(null, 10, leftChild, rightChild);
 * ```
 */
export class HuffmanNode {
  /**
   * @param character - The character stored in this node (null for internal nodes)
   * @param frequency - The frequency/weight of this node
   * @param left - Left child node (null for leaf nodes)
   * @param right - Right child node (null for leaf nodes)
   */
  constructor(
    public readonly character: string | null,
    public readonly frequency: number,
    public readonly left: HuffmanNode | null = null,
    public readonly right: HuffmanNode | null = null,
  ) {}

  /**
   * Checks if this node is a leaf node (contains a character)
   */
  isLeaf(): boolean {
    return this.left === null && this.right === null
  }

  /**
   * Serializes the node and its children to a plain object
   * Used for saving the tree structure to JSON files
   */
  toJSON(): HuffmanNodeJSON {
    return {
      character: this.character,
      frequency: this.frequency,
      left: this.left?.toJSON() ?? null,
      right: this.right?.toJSON() ?? null,
    }
  }

  /**
   * Deserializes a plain object back into a HuffmanNode
   * Used for loading tree structures from JSON files
   */
  static fromJSON(json: HuffmanNodeJSON): HuffmanNode {
    return new HuffmanNode(
      json.character,
      json.frequency,
      json.left ? HuffmanNode.fromJSON(json.left) : null,
      json.right ? HuffmanNode.fromJSON(json.right) : null,
    )
  }

  /**
   * Compares two nodes by frequency (for priority queue/heap)
   * Returns negative if this node should come before the other
   */
  compareTo(other: HuffmanNode): number {
    return this.frequency - other.frequency
  }
}

/**
 * JSON representation of a Huffman node
 * Used for serialization/deserialization
 */
export interface HuffmanNodeJSON {
  character: string | null
  frequency: number
  left: HuffmanNodeJSON | null
  right: HuffmanNodeJSON | null
}
