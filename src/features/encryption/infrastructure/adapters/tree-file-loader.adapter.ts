import { readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { HuffmanNode } from '../../domain';
import { TreeSerializer, TreeJSON } from '../serializers/tree-serializer';

/**
 * Tree File Loader Adapter
 *
 * Handles loading Huffman trees from JSON files.
 * Supports both absolute and relative paths.
 *
 * @remarks
 * This is a backend-only adapter (uses Node.js fs module).
 * For frontend, you'll need a different implementation using fetch/axios.
 *
 * @example
 * ```typescript
 * const loader = new TreeFileLoaderAdapter();
 * const tree = await loader.loadTree('src/features/encryption/trees/huffman-back.tree.json');
 * ```
 */
export class TreeFileLoaderAdapter {
  private readonly treeSerializer: TreeSerializer;
  private readonly cache: Map<string, HuffmanNode>;

  constructor() {
    this.treeSerializer = new TreeSerializer();
    this.cache = new Map();
  }

  /**
   * Loads a Huffman tree from a JSON file
   *
   * @param filePath - Path to the JSON file (absolute or relative to project root)
   * @param useCache - Whether to use cached tree if available (default: true)
   * @returns The loaded Huffman tree root node
   *
   * @throws {Error} If file doesn't exist or is invalid
   */
  async loadTree(filePath: string, useCache = true): Promise<HuffmanNode> {
    const resolvedPath = resolve(filePath);

    // Check cache first
    if (useCache && this.cache.has(resolvedPath)) {
      return this.cache.get(resolvedPath)!;
    }

    // Check if file exists
    if (!existsSync(resolvedPath)) {
      throw new Error(`Tree file not found: ${resolvedPath}`);
    }

    try {
      // Read and parse JSON file
      const fileContent = await readFile(resolvedPath, 'utf-8');
      const treeJSON: TreeJSON = JSON.parse(fileContent) as TreeJSON;

      // Validate JSON structure
      if (!this.treeSerializer.isValidTreeJSON(treeJSON)) {
        throw new Error('Invalid tree JSON structure');
      }

      // Deserialize to HuffmanNode
      const tree = this.treeSerializer.jsonToTree(treeJSON);

      // Cache the tree
      if (useCache) {
        this.cache.set(resolvedPath, tree);
      }

      return tree;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in tree file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Loads a tree synchronously (blocking)
   * Use sparingly - prefer async loadTree when possible
   *
   * @param filePath - Path to the JSON file
   * @returns The loaded Huffman tree root node
   */
  loadTreeSync(filePath: string): HuffmanNode {
    const resolvedPath = resolve(filePath);

    // Check cache first
    if (this.cache.has(resolvedPath)) {
      return this.cache.get(resolvedPath)!;
    }

    if (!existsSync(resolvedPath)) {
      throw new Error(`Tree file not found: ${resolvedPath}`);
    }

    try {
      const fileContent = readFileSync(resolvedPath, 'utf-8');
      const treeJSON: TreeJSON = JSON.parse(fileContent) as TreeJSON;

      if (!this.treeSerializer.isValidTreeJSON(treeJSON)) {
        throw new Error('Invalid tree JSON structure');
      }

      const tree = this.treeSerializer.jsonToTree(treeJSON);
      this.cache.set(resolvedPath, tree);

      return tree;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in tree file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Checks if a tree file exists
   */
  fileExists(filePath: string): boolean {
    const resolvedPath = resolve(filePath);
    return existsSync(resolvedPath);
  }

  /**
   * Clears the tree cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): CacheStats {
    return {
      size: this.cache.size,
      paths: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  paths: string[];
}
