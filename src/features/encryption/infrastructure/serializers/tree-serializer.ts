import { HuffmanNode, HuffmanNodeJSON } from '../../domain'

/**
 * Tree Serializer
 *
 * Handles serialization and deserialization of Huffman trees to/from JSON.
 * This allows trees to be saved to files and loaded when needed.
 *
 * @remarks
 * - Trees are stored with both the node structure and pre-computed code table
 * - This implementation is framework-agnostic
 *
 * @example
 * ```typescript
 * const serializer = new TreeSerializer();
 * const json = serializer.treeToJSON(rootNode);
 * const tree = serializer.jsonToTree(json);
 * ```
 */
export class TreeSerializer {
  /**
   * Serializes a Huffman tree to JSON
   *
   * @param root - The root node of the Huffman tree
   * @returns JSON object with tree structure and code table
   */
  treeToJSON(root: HuffmanNode): TreeJSON {
    const codeTable = this.buildCodeTable(root)

    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      root: root.toJSON(),
      codeTable,
      metadata: {
        totalCharacters: Object.keys(codeTable).length,
        maxCodeLength: Math.max(
          ...Object.values(codeTable).map((c) => c.length),
        ),
        minCodeLength: Math.min(
          ...Object.values(codeTable).map((c) => c.length),
        ),
      },
    }
  }

  /**
   * Deserializes JSON back to a Huffman tree root node
   *
   * @param json - The JSON object containing the tree
   * @returns The root HuffmanNode
   */
  jsonToTree(json: TreeJSON): HuffmanNode {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!json.root) {
      throw new Error('Invalid tree JSON: missing root node')
    }

    return HuffmanNode.fromJSON(json.root)
  }

  /**
   * Builds a code table from a Huffman tree
   * Maps each character to its binary code
   *
   * @param root - The root node of the tree
   * @returns Object mapping characters to their binary codes
   */
  buildCodeTable(root: HuffmanNode): Record<string, string> {
    const codeTable: Record<string, string> = {}

    const traverse = (node: HuffmanNode, code: string) => {
      if (node.isLeaf() && node.character !== null) {
        codeTable[node.character] = code || '0' // Single node tree edge case
        return
      }

      if (node.left) {
        traverse(node.left, code + '0')
      }

      if (node.right) {
        traverse(node.right, code + '1')
      }
    }

    traverse(root, '')
    return codeTable
  }

  /**
   * Validates if a JSON object is a valid tree structure
   *
   * @param json - The JSON to validate
   * @returns true if valid, false otherwise
   */
  isValidTreeJSON(json: unknown): json is TreeJSON {
    if (typeof json !== 'object' || json === null) {
      return false
    }

    const tree = json as TreeJSON

    return (
      typeof tree.version === 'string' &&
      typeof tree.createdAt === 'string' &&
      typeof tree.root === 'object' &&
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      tree.root !== null &&
      typeof tree.codeTable === 'object' &&
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      tree.codeTable !== null
    )
  }

  /**
   * Pretty prints a tree structure for debugging
   *
   * @param root - The root node of the tree
   * @param prefix - Prefix for indentation (internal use)
   * @param isLeft - Whether this is a left child (internal use)
   * @returns String representation of the tree
   */
  prettyPrint(root: HuffmanNode, prefix = '', isLeft = true): string {
    let result = ''

    if (root.right) {
      result += this.prettyPrint(
        root.right,
        prefix + (isLeft ? '│   ' : '    '),
        false,
      )
    }

    result +=
      prefix +
      (isLeft ? '└── ' : '┌── ') +
      (root.character || '∅') +
      ` (${root.frequency})\n`

    if (root.left) {
      result += this.prettyPrint(
        root.left,
        prefix + (isLeft ? '    ' : '│   '),
        true,
      )
    }

    return result
  }
}

/**
 * JSON structure for serialized Huffman tree
 */
export interface TreeJSON {
  version: string
  createdAt: string
  root: HuffmanNodeJSON
  codeTable: Record<string, string>
  metadata: {
    totalCharacters: number
    maxCodeLength: number
    minCodeLength: number
  }
}
