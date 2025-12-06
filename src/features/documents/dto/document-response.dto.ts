import { ApiProperty } from '@nestjs/swagger'
import {
  DocumentType,
  DocumentCategory,
  DocumentStatus,
} from './create-document.dto'

export class DocumentAttachmentResponseDto {
  @ApiProperty({
    description: 'ID del adjunto',
    example: 1,
    type: Number,
  })
  id: number

  @ApiProperty({
    description: 'Nombre del archivo',
    example: 'adjunto.pdf',
    type: String,
  })
  fileName: string

  @ApiProperty({
    description: 'Ruta del archivo',
    example:
      'uploads/documents/attachments/attachment-adjunto-1234567890-abc123.pdf',
    type: String,
  })
  filePath: string

  @ApiProperty({
    description: 'ID del documento',
    example: 1,
    type: Number,
  })
  documentId: number

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-12-06T10:00:00Z',
    type: Date,
  })
  createdAt: Date
}

export class DocumentRecipientResponseDto {
  @ApiProperty({
    description: 'ID del registro de recipient',
    example: 1,
    type: Number,
  })
  id: number

  @ApiProperty({
    description: 'ID del documento',
    example: 1,
    type: Number,
  })
  documentId: number

  @ApiProperty({
    description: 'ID del usuario receptor',
    example: 2,
    type: Number,
  })
  recipientId: number

  @ApiProperty({
    description: 'Indica si el documento ha sido leído',
    example: false,
    type: Boolean,
  })
  isRead: boolean

  @ApiProperty({
    description: 'Fecha de lectura del documento',
    example: '2024-12-06T10:00:00Z',
    type: Date,
    required: false,
  })
  readDate?: Date | null

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-12-06T10:00:00Z',
    type: Date,
  })
  createdAt: Date
}

export class DocumentResponseDto {
  @ApiProperty({
    description: 'ID del documento',
    example: 1,
    type: Number,
  })
  id: number

  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: 'OFICIO',
  })
  documentType: DocumentType

  @ApiProperty({
    description: 'Categoría del documento',
    enum: DocumentCategory,
    example: 'NORMAL',
  })
  category: DocumentCategory

  @ApiProperty({
    description: 'Estado del documento',
    enum: DocumentStatus,
    example: 'BORRADOR',
  })
  status: DocumentStatus

  @ApiProperty({
    description: 'Asunto del documento',
    example: 'Solicitud de información',
    type: String,
  })
  subject: string

  @ApiProperty({
    description:
      'Cuerpo del documento (puede estar cifrado si category es CIFRADO)',
    example: '<h1>Mi Documento</h1><p>Contenido...</p>',
    type: String,
  })
  body: string

  @ApiProperty({
    description: 'ID del autor del documento',
    example: 1,
    type: Number,
  })
  authorId: number

  @ApiProperty({
    description: 'ID del documento padre (si es una respuesta)',
    example: 1,
    type: Number,
    required: false,
  })
  parentDocumentId?: number | null

  @ApiProperty({
    description: 'Fecha de envío del documento',
    example: '2024-12-06T10:00:00Z',
    type: Date,
    required: false,
  })
  sendDate?: Date | null

  @ApiProperty({
    description: 'Ruta del archivo PDF generado',
    example: 'uploads/documents/pdf-documento-1234567890-abc123.pdf',
    type: String,
    required: false,
  })
  pdfPath?: string | null

  @ApiProperty({
    description: 'Firma QR del documento',
    example: 'firma-qr-123',
    type: String,
    required: false,
  })
  qrSignature?: string | null

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-12-06T10:00:00Z',
    type: Date,
  })
  createdAt: Date

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-12-06T10:00:00Z',
    type: Date,
  })
  updatedAt: Date

  @ApiProperty({
    description: 'Adjuntos del documento',
    type: [DocumentAttachmentResponseDto],
    required: false,
  })
  attachments?: DocumentAttachmentResponseDto[]

  @ApiProperty({
    description: 'Destinatarios del documento',
    type: [DocumentRecipientResponseDto],
    required: false,
  })
  recipients?: DocumentRecipientResponseDto[]
}

export class CreateDocumentResponseDto {
  @ApiProperty({
    description: 'Documento creado',
    type: DocumentResponseDto,
  })
  document: DocumentResponseDto
}

export class GetDocumentsResponseDto {
  @ApiProperty({
    description: 'Lista de documentos',
    type: [DocumentResponseDto],
  })
  documents: DocumentResponseDto[]

  @ApiProperty({
    description: 'Total de documentos',
    example: 10,
    type: Number,
  })
  total: number
}
