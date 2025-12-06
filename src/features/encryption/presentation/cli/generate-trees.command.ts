#!/usr/bin/env node

/**
 * Generate Huffman Trees CLI Script
 *
 * Command-line utility to generate the three required Huffman trees
 * for backend, frontend, and database encryption layers.
 *
 * Usage:
 *   pnpm tsx src/features/encryption/presentation/cli/generate-trees.command.ts
 *
 * Or add to package.json:
 *   "scripts": {
 *     "huffman:generate": "tsx src/features/encryption/presentation/cli/generate-trees.command.ts"
 *   }
 */

import { resolve } from 'path'
import { GenerateHuffmanTreesUseCase } from '../../application'

async function main() {
  console.log('🌳 Generating Huffman Trees...\n')

  const useCase = new GenerateHuffmanTreesUseCase()

  const outputDir = resolve(__dirname, '../../trees')

  console.log(`📁 Output directory: ${outputDir}\n`)

  try {
    const result = await useCase.execute({
      outputDir,
      randomizationFactor: 0.15,
    })

    if (!result.success) {
      console.error('❌ Failed to generate trees:', result.error)
      process.exit(1)
    }

    console.log('✅ Successfully generated Huffman trees!\n')
    console.log('📄 Generated files:')
    console.log(`   - Backend:  ${result.paths.backend}`)
    console.log(`   - Frontend: ${result.paths.frontend}`)
    console.log(`   - Database: ${result.paths.database}\n`)

    console.log('📊 Metadata:')
    console.log(`   - Characters: ${result.metadata.charactersCount}`)
    console.log(
      `   - Randomization: ${result.metadata.randomizationFactor * 100}%`,
    )
    console.log(`   - Generated: ${result.metadata.generatedAt}\n`)

    console.log('📝 Next steps:')
    console.log('   1. Update your .env file with the tree paths:')
    console.log(`      HUFFMAN_TREE_BACK_PATH=${result.paths.backend}`)
    console.log(`      HUFFMAN_TREE_DB_PATH=${result.paths.database}`)
    console.log('   2. Copy huffman-front.tree.json to your frontend project')
    console.log('   3. Restart your application\n')

    console.log('🎉 Done!\n')
  } catch (error) {
    console.error(
      '❌ Unexpected error:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    console.error(error instanceof Error ? error.stack : 'Unknown stack')
    process.exit(1)
  }
}

void main()
