import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { FrequencyMap } from '../../domain';
import { HuffmanTreeGenerator, TreeSerializer } from '../../infrastructure';

/**
 * Generate Huffman Trees Use Case
 *
 * Handles the business logic for generating the three required Huffman trees
 * (backend, frontend, database) and saving them to JSON files.
 *
 * @remarks
 * This use case is typically run once during project setup.
 * It generates three different trees with the same character set but different structures.
 *
 * @example
 * ```typescript
 * const useCase = new GenerateHuffmanTreesUseCase();
 * const result = await useCase.execute({
 *   outputDir: 'src/features/encryption/trees',
 *   randomizationFactor: 0.15
 * });
 * ```
 */
export class GenerateHuffmanTreesUseCase {
  private readonly generator: HuffmanTreeGenerator;
  private readonly serializer: TreeSerializer;

  constructor() {
    this.generator = new HuffmanTreeGenerator();
    this.serializer = new TreeSerializer();
  }

  /**
   * Executes the tree generation process
   *
   * @param input - Configuration for tree generation
   * @returns Result with paths to generated files
   */
  async execute(input: GenerateTreesInput): Promise<GenerateTreesOutput> {
    try {
      const outputDir = resolve(input.outputDir);

      // Ensure output directory exists
      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true });
      }

      // Generate frequency map (custom or default)
      const frequencyMap = input.customFrequencies
        ? FrequencyMap.fromObject(input.customFrequencies)
        : FrequencyMap.createDefault();

      // Generate three different trees
      const randomizationFactor = input.randomizationFactor ?? 0.15;
      const trees = this.generator.generateThreeTrees(frequencyMap, randomizationFactor);

      // Serialize trees to JSON
      const backendJSON = this.serializer.treeToJSON(trees.backendTree);
      const frontendJSON = this.serializer.treeToJSON(trees.frontendTree);
      const databaseJSON = this.serializer.treeToJSON(trees.databaseTree);

      // Define file paths
      const backendPath = resolve(outputDir, 'huffman-back.tree.json');
      const frontendPath = resolve(outputDir, 'huffman-front.tree.json');
      const databasePath = resolve(outputDir, 'huffman-db.tree.json');

      // Write files
      await Promise.all([
        writeFile(backendPath, JSON.stringify(backendJSON, null, 2), 'utf-8'),
        writeFile(frontendPath, JSON.stringify(frontendJSON, null, 2), 'utf-8'),
        writeFile(databasePath, JSON.stringify(databaseJSON, null, 2), 'utf-8'),
      ]);

      return {
        success: true,
        paths: {
          backend: backendPath,
          frontend: frontendPath,
          database: databasePath,
        },
        metadata: {
          charactersCount: frequencyMap.getSize(),
          randomizationFactor,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        paths: {
          backend: '',
          frontend: '',
          database: '',
        },
        metadata: {
          charactersCount: 0,
          randomizationFactor: 0,
          generatedAt: new Date().toISOString(),
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generates trees from sample text instead of default frequencies
   */
  async executeFromSampleText(input: GenerateFromSampleInput): Promise<GenerateTreesOutput> {
    const frequencyMap = FrequencyMap.fromText(input.sampleText);

    return this.execute({
      outputDir: input.outputDir,
      customFrequencies: frequencyMap.toObject(),
      randomizationFactor: input.randomizationFactor,
    });
  }
}

export interface GenerateTreesInput {
  outputDir: string;
  customFrequencies?: Record<string, number>;
  randomizationFactor?: number;
}

export interface GenerateFromSampleInput {
  outputDir: string;
  sampleText: string;
  randomizationFactor?: number;
}

export interface GenerateTreesOutput {
  success: boolean;
  paths: {
    backend: string;
    frontend: string;
    database: string;
  };
  metadata: {
    charactersCount: number;
    randomizationFactor: number;
    generatedAt: string;
  };
  error?: string;
}
