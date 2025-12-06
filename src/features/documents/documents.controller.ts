// backend/src/modules/documents/documents.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  Res,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request, Response } from 'express'
import * as path from 'path'
import { FilesInterceptor } from '@nestjs/platform-express'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { DocumentsService } from './documents.service'
import { CreateDocumentDto, DocumentStatus } from './dto/create-document.dto'
import { UpdateDocumentDto } from './dto/update-document.dto'
import {
  CreateDocumentResponseDto,
  GetDocumentsResponseDto,
  DocumentResponseDto,
} from './dto/document-response.dto'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    microsoftId: string
  }
}

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('attachments', 10))
  @ApiOperation({
    summary: 'Crea un nuevo documento',
    description:
      'Crea un documento con su PDF. Si category es NORMAL, requiere contraseña. Si es CIFRADO, cifra el contenido. Acepta archivos PDF adjuntos.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['documentType', 'category', 'subject', 'html', 'authorId'],
      properties: {
        documentType: {
          type: 'string',
          enum: ['OFICIO', 'MEMORANDO'],
          example: 'OFICIO',
        },
        category: {
          type: 'string',
          enum: ['NORMAL', 'CIFRADO'],
          example: 'NORMAL',
        },
        status: {
          type: 'string',
          enum: ['BORRADOR', 'EN_ELABORACION', 'ENVIADO', 'NO_ENVIADO'],
          example: 'BORRADOR',
        },
        subject: {
          type: 'string',
          example: 'Solicitud de información',
        },
        html: {
          type: 'string',
          example: '<h1>Mi Documento</h1><p>Contenido del documento...</p>',
        },
        authorId: {
          type: 'number',
          example: 1,
        },
        parentDocumentId: {
          type: 'number',
          example: 1,
        },
        sendDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-12-06T10:00:00Z',
        },
        password: {
          type: 'string',
          example: 'miContraseña123',
          description: 'Requerida si category es NORMAL',
        },
        qrSignature: {
          type: 'string',
          example: 'firma-qr-123',
        },
        attachments: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Archivos PDF adjuntos (máximo 10)',
        },
        recipientEmails: {
          type: 'array',
          items: {
            type: 'string',
            format: 'email',
          },
          example: ['usuario1@uta.edu.ec', 'usuario2@uta.edu.ec'],
          description:
            'Lista de correos electrónicos de los destinatarios. Si el usuario no existe, se creará automáticamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento creado exitosamente',
    type: CreateDocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la validación de datos',
  })
  async createDocument(
    @Body() dto: CreateDocumentDto,
    @UploadedFiles() attachments?: Express.Multer.File[],
  ) {
    try {
      const result = await this.documentsService.createDocument(
        dto,
        attachments,
      )

      return {
        success: true,
        message: 'Documento creado exitosamente',
        data: result,
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error al crear el documento',
      )
    }
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtiene todos los documentos',
    description: 'Retorna una lista de todos los documentos con sus adjuntos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos obtenida exitosamente',
    type: GetDocumentsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error al obtener los documentos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getAllDocuments(@Req() req: AuthenticatedRequest) {
    try {
      const userId = parseInt(req.user?.id || '0', 10)
      if (!userId) {
        throw new BadRequestException('Usuario no autenticado')
      }

      const result = await this.documentsService.getAllDocuments(userId)

      return {
        success: true,
        message: 'Documentos obtenidos exitosamente',
        data: result,
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error al obtener los documentos',
      )
    }
  }

  @Get('status/recibido')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtiene documentos recibidos',
    description:
      'Retorna una lista de todos los documentos donde el usuario autenticado es receptor, buscando en la tabla document_recipients',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos obtenida exitosamente',
    type: GetDocumentsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error al obtener los documentos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getDocumentsByRecibido(@Req() req: AuthenticatedRequest) {
    try {
      const userId = parseInt(req.user?.id || '0', 10)
      if (!userId) {
        throw new BadRequestException('Usuario no autenticado')
      }

      const result = await this.documentsService.getDocumentsByRecibido(userId)

      return {
        success: true,
        message: 'Documentos recibidos obtenidos exitosamente',
        data: result,
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error al obtener los documentos',
      )
    }
  }

  @Get('status/:status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtiene documentos por estado',
    description:
      'Retorna una lista de documentos filtrados por estado del usuario autenticado. Estados válidos: BORRADOR, EN_ELABORACION, ENVIADO, NO_ENVIADO',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos obtenida exitosamente',
    type: GetDocumentsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error: estado inválido o error al obtener los documentos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getDocumentsByStatus(
    @Param('status') status: string,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const userId = parseInt(req.user?.id || '0', 10)
      if (!userId) {
        throw new BadRequestException('Usuario no autenticado')
      }

      // Validar que el status sea uno de los permitidos
      const validStatuses = [
        DocumentStatus.BORRADOR,
        DocumentStatus.EN_ELABORACION,
        DocumentStatus.ENVIADO,
        DocumentStatus.NO_ENVIADO,
      ]

      // Convertir el parámetro a mayúsculas para comparar
      const upperStatus = status.toUpperCase()

      if (!validStatuses.includes(upperStatus as DocumentStatus)) {
        throw new BadRequestException(
          `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`,
        )
      }

      const result = await this.documentsService.getDocumentsByStatus(
        upperStatus as DocumentStatus,
        userId,
      )

      return {
        success: true,
        message: `Documentos en estado ${upperStatus} obtenidos exitosamente`,
        data: result,
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error al obtener los documentos',
      )
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtiene un documento por su ID',
    description: 'Retorna un documento específico con sus adjuntos',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento obtenido exitosamente',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error: documento no encontrado o error al obtenerlo',
  })
  async getDocumentById(@Param('id', ParseIntPipe) id: number) {
    try {
      const document = await this.documentsService.getDocumentById(id)

      return {
        success: true,
        message: 'Documento obtenido exitosamente',
        data: document,
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error al obtener el documento',
      )
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualiza un documento existente',
    description:
      'Actualiza los campos de un documento. Si se actualiza el HTML y category es NORMAL, requiere contraseña. Si es CIFRADO, cifra el contenido automáticamente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento actualizado exitosamente',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error: documento no encontrado o error en la validación',
  })
  async updateDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentDto,
  ) {
    try {
      const document = await this.documentsService.updateDocument(id, dto)

      return {
        success: true,
        message: 'Documento actualizado exitosamente',
        data: document,
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error al actualizar el documento',
      )
    }
  }

  @Get('pdf/download')
  @ApiOperation({
    summary: 'Descarga un archivo PDF por su ruta',
    description:
      'Recibe la ruta del archivo PDF y devuelve el buffer del archivo para descarga o visualización',
  })
  @ApiQuery({
    name: 'path',
    description:
      'Ruta relativa del archivo PDF (ej: uploads/documents/documento.pdf)',
    example: 'uploads/documents/pdf-documento-1234567890-abc123.pdf',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo PDF obtenido exitosamente',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error: ruta inválida o archivo no es un PDF válido',
  })
  @ApiResponse({
    status: 404,
    description: 'Error: archivo no encontrado',
  })
  async downloadPdf(@Query('path') filePath: string, @Res() res: Response) {
    console.log('filePath', filePath)
    try {
      if (!filePath) {
        throw new BadRequestException('La ruta del archivo es requerida')
      }

      const pdfBuffer = await this.documentsService.getPdfByPath(filePath)

      // Obtener el nombre del archivo de la ruta
      const fileName = path.basename(filePath)

      // Configurar headers para la descarga
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      res.setHeader('Content-Length', pdfBuffer.length.toString())

      // Enviar el buffer
      res.send(pdfBuffer)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error al descargar el archivo PDF',
      )
    }
  }
}
