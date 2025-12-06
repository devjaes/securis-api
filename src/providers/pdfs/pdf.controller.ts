import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import * as path from 'path'
import { PdfService } from './pdf.service'
import { GeneratePdfDto } from './dto/generate-pdf.dto'
import { GeneratePdfProtectedDto } from './dto/generate-pdf-protected.dto'

@ApiTags('PDF')
@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Genera un PDF a partir de HTML',
    description:
      'Crea un archivo PDF a partir del contenido HTML proporcionado',
  })
  @ApiBody({ type: GeneratePdfDto })
  @ApiResponse({
    status: 200,
    description: 'PDF generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'PDF generado exitosamente' },
        filePath: {
          type: 'string',
          example: 'uploads/documents/pdf-documento-1234567890-abc123.pdf',
        },
        filename: {
          type: 'string',
          example: 'pdf-documento-1234567890-abc123.pdf',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la validación de datos',
  })
  async generatePdf(@Body() dto: GeneratePdfDto) {
    try {
      const filePath = await this.pdfService.generatePdf(dto.html, {
        title: dto.title,
        filename: dto.filename,
        author: dto.author,
        subject: dto.subject,
      })

      const filename = path.basename(filePath)

      return {
        success: true,
        message: 'PDF generado exitosamente',
        filePath,
        filename,
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error al generar el PDF',
      )
    }
  }

  @Post('generate-protected')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Genera un PDF protegido con contraseña a partir de HTML',
    description:
      'Crea un archivo PDF protegido con contraseña a partir del contenido HTML proporcionado',
  })
  @ApiBody({ type: GeneratePdfProtectedDto })
  @ApiResponse({
    status: 200,
    description: 'PDF protegido generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'PDF protegido generado exitosamente',
        },
        filePath: {
          type: 'string',
          example:
            'uploads/documents/pdf-protected-documento-1234567890-abc123.pdf',
        },
        filename: {
          type: 'string',
          example: 'pdf-protected-documento-1234567890-abc123.pdf',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la validación de datos o al proteger el PDF',
  })
  async generatePdfProtected(@Body() dto: GeneratePdfProtectedDto) {
    try {
      const filePath = await this.pdfService.generatePdfWithPassword(
        dto.html,
        dto.password,
        {
          title: dto.title,
          filename: dto.filename,
          author: dto.author,
          subject: dto.subject,
        },
      )

      const filename = path.basename(filePath)

      return {
        success: true,
        message: 'PDF protegido generado exitosamente',
        filePath,
        filename,
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error al generar el PDF protegido',
      )
    }
  }
}
