import { Controller, Get, Post, Body } from '@nestjs/common'
import { IsString, IsNotEmpty } from 'class-validator'
import { HuffmanBackService, HuffmanFrontService } from '..'

class DecryptDto {
  @IsString()
  @IsNotEmpty()
  encrypted: string
}

/**
 * Encryption Controller
 *
 * Endpoints for testing Huffman encryption/decryption
 */
@Controller('encryption')
export class EncryptionController {
  constructor(
    private readonly huffmanBack: HuffmanBackService,
    private readonly huffmanFront: HuffmanFrontService,
  ) {}

  /**
   * GET /encryption/test-message
   * Returns an encrypted message that the frontend should decrypt
   */
  @Get('test-message')
  getEncryptedMessage() {
    const message =
      'Hola desde el backend! 123 Este es un mensaje de prueba cifrado con Huffman.'
    const encrypted = this.huffmanBack.encode(message)

    return {
      encrypted,
      message: 'Mensaje cifrado listo para descifrar en el frontend',
    }
  }

  /**
   * POST /encryption/decrypt
   * Receives encrypted text from frontend and decrypts it
   *
   * This endpoint uses a DTO to test that ValidationPipe works correctly
   * after the middleware decrypts the payload.
   *
   * Flow:
   * 1. Frontend sends: { payload: "huffman_encoded_json" }
   * 2. Middleware decrypts payload → req.body = { encrypted: "texto_plano" }
   * 3. Controller receives the already decrypted value
   * 4. Controller returns response encrypted with backend tree
   */
  @Post('decrypt')
  decryptMessage(@Body() body: DecryptDto) {
    const decrypted = body.encrypted

    const encryptedResponse = this.huffmanBack.encode(decrypted)

    return {
      success: true,
      decrypted,
      encrypted: encryptedResponse,
      message:
        'Mensaje descifrado correctamente y respuesta encriptada con árbol backend',
    }
  }
}
