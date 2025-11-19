import { FrequencyMap } from '../domain';
import { HuffmanTreeGenerator } from '../infrastructure';
import { HuffmanEncoderAdapter, HuffmanDecoderAdapter } from '../infrastructure';

/**
 * Integration tests for the complete Huffman encode/decode cycle
 *
 * These tests verify the core functionality:
 * 1. Tree generation works correctly
 * 2. Text can be encoded to Base64
 * 3. Encoded text can be decoded back to original
 * 4. UTF-8 characters (Spanish) are supported
 * 5. Edge cases are handled properly
 */
describe('Huffman Encryption Integration', () => {
  let generator: HuffmanTreeGenerator;

  beforeEach(() => {
    generator = new HuffmanTreeGenerator();
  });

  describe('Basic Encode/Decode Cycle', () => {
    it('should encode and decode simple English text correctly', () => {
      const originalText = 'Hello World';
      const tree = generator.generateFromText(originalText);

      const encoder = new HuffmanEncoderAdapter(tree);
      const decoder = new HuffmanDecoderAdapter(tree);

      const encoded = encoder.encode(originalText);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe(originalText);
    });

    it('should encode and decode Spanish text with accents', () => {
      const originalText = 'Hola Mundo! ¿Cómo estás? ¡Excelente!';
      const tree = generator.generateFromText(originalText);

      const encoder = new HuffmanEncoderAdapter(tree);
      const decoder = new HuffmanDecoderAdapter(tree);

      const encoded = encoder.encode(originalText);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe(originalText);
    });

    it('should handle text with special characters', () => {
      const originalText = 'Nombre: José\nApellido: Peña\nAño: 2025\nCorreo: jose@uta.edu.ec';
      const tree = generator.generateFromText(originalText);

      const encoder = new HuffmanEncoderAdapter(tree);
      const decoder = new HuffmanDecoderAdapter(tree);

      const encoded = encoder.encode(originalText);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe(originalText);
    });

    it('should handle long text (document content)', () => {
      const originalText = `
        Universidad Técnica de Ambato
        Facultad de Ingeniería en Sistemas
        
        OFICIO N° 001-2025-FIS
        
        Asunto: Solicitud de aprobación de proyecto de titulación
        
        De mi consideración:
        
        Por medio del presente, solicito a usted la aprobación del proyecto
        de titulación denominado "Sistema de Gestión Documental Seguro con
        Cifrado Multi-capa utilizando Algoritmo de Huffman".
        
        Atentamente,
        
        Jair Andrés Espinoza Salazar
      `.trim();

      const tree = generator.generateFromText(originalText);

      const encoder = new HuffmanEncoderAdapter(tree);
      const decoder = new HuffmanDecoderAdapter(tree);

      const encoded = encoder.encode(originalText);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe(originalText);
    });
  });

  describe('Default Tree with UTF-8 Support', () => {
    it('should encode/decode using default frequency map', () => {
      const originalText = 'Este es un texto de prueba con ñ y acentos: á é í ó ú';
      const tree = generator.generateDefaultTree();

      const encoder = new HuffmanEncoderAdapter(tree);
      const decoder = new HuffmanDecoderAdapter(tree);

      const encoded = encoder.encode(originalText);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe(originalText);
    });

    it('should handle all Spanish special characters', () => {
      const originalText = 'ñ Ñ á é í ó ú Á É Í Ó Ú ü Ü ¿ ¡';
      const freqMap = FrequencyMap.createDefault();
      const tree = generator.generateFromFrequencyMap(freqMap);

      const encoder = new HuffmanEncoderAdapter(tree);
      const decoder = new HuffmanDecoderAdapter(tree);

      const encoded = encoder.encode(originalText);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe(originalText);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single character text', () => {
      const originalText = 'a';
      const tree = generator.generateFromText(originalText);

      const encoder = new HuffmanEncoderAdapter(tree);
      const decoder = new HuffmanDecoderAdapter(tree);

      const encoded = encoder.encode(originalText);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe(originalText);
    });

    it('should handle repeated character text', () => {
      const originalText = 'aaaaaaa';
      const tree = generator.generateFromText(originalText);

      const encoder = new HuffmanEncoderAdapter(tree);
      const decoder = new HuffmanDecoderAdapter(tree);

      const encoded = encoder.encode(originalText);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe(originalText);
    });

    it('should throw error for empty text', () => {
      const tree = generator.generateDefaultTree();
      const encoder = new HuffmanEncoderAdapter(tree);

      expect(() => encoder.encode('')).toThrow('Cannot encode empty text');
    });

    it('should throw error for text with unsupported characters when using limited tree', () => {
      const limitedText = 'abc';
      const tree = generator.generateFromText(limitedText);
      const encoder = new HuffmanEncoderAdapter(tree);

      expect(() => encoder.encode('abcd')).toThrow('Cannot encode text');
    });
  });

  describe('Different Trees Generate Different Encodings', () => {
    it('should produce different encodings with different trees (or same if randomization yields identical structure)', () => {
      const originalText = 'Hello World';

      const freqMap = FrequencyMap.fromText(originalText);
      const tree1 = generator.generateWithRandomization(freqMap, 0.2);
      const tree2 = generator.generateWithRandomization(freqMap, 0.2);

      const encoder1 = new HuffmanEncoderAdapter(tree1);
      const encoder2 = new HuffmanEncoderAdapter(tree2);

      const encoded1 = encoder1.encode(originalText);
      const encoded2 = encoder2.encode(originalText);

      // Both trees must decode correctly (this is the critical requirement)
      const decoder1 = new HuffmanDecoderAdapter(tree1);
      const decoder2 = new HuffmanDecoderAdapter(tree2);

      expect(decoder1.decode(encoded1)).toBe(originalText);
      expect(decoder2.decode(encoded2)).toBe(originalText);

      // If encodings are different, verify they can't be cross-decoded
      if (encoded1 !== encoded2) {
        expect(() => decoder1.decode(encoded2)).toThrow();
        expect(() => decoder2.decode(encoded1)).toThrow();
      }
    });

    it('should eventually produce different trees with multiple attempts', () => {
      const originalText = 'Hello World';
      const freqMap = FrequencyMap.fromText(originalText);

      const encodings = new Set<string>();
      const attempts = 10;

      // Generate multiple trees and collect their encodings
      for (let i = 0; i < attempts; i++) {
        const tree = generator.generateWithRandomization(freqMap, 0.3);
        const encoder = new HuffmanEncoderAdapter(tree);
        const encoded = encoder.encode(originalText);
        encodings.add(encoded);
      }

      // With 10 attempts and 30% randomization, we should get at least 2 different encodings
      expect(encodings.size).toBeGreaterThan(1);
    });
  });

  describe('Compression Statistics', () => {
    it('should provide accurate compression statistics', () => {
      const originalText = 'Hello World! This is a compression test.';
      const tree = generator.generateFromText(originalText);

      const encoder = new HuffmanEncoderAdapter(tree);
      const stats = encoder.getEncodingStats(originalText);

      expect(stats.originalLength).toBe(originalText.length);
      expect(stats.compressionRatio).toBeGreaterThan(0);
      expect(stats.compressionRatio).toBeLessThan(1);
      expect(stats.spaceSavings).toBeGreaterThan(0);
      expect(stats.spaceSavings).toBeLessThan(100);
    });
  });

  describe('Validation Methods', () => {
    it('should validate if text can be encoded', () => {
      const tree = generator.generateFromText('abc');
      const encoder = new HuffmanEncoderAdapter(tree);

      expect(encoder.canEncode('abc')).toBe(true);
      expect(encoder.canEncode('abcd')).toBe(false);
    });

    it('should validate if encoded text can be decoded', () => {
      const originalText = 'test';
      const tree = generator.generateFromText(originalText);

      const encoder = new HuffmanEncoderAdapter(tree);
      const decoder = new HuffmanDecoderAdapter(tree);

      const encoded = encoder.encode(originalText);

      expect(decoder.canDecode(encoded)).toBe(true);
      expect(decoder.canDecode('invalid-base64!')).toBe(false);
    });

    it('should get unencodable characters', () => {
      const tree = generator.generateFromText('abc');
      const encoder = new HuffmanEncoderAdapter(tree);

      const unencodable = encoder.getUnencodableCharacters('abcdef');

      expect(unencodable).toContain('d');
      expect(unencodable).toContain('e');
      expect(unencodable).toContain('f');
      expect(unencodable).not.toContain('a');
      expect(unencodable).not.toContain('b');
      expect(unencodable).not.toContain('c');
    });
  });
});
