import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  DocumentType,
  DocumentCategory,
  DocumentStatus,
} from './create-document.dto'

export class UpdateDocumentDto {
  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: 'OFICIO',
    required: false,
  })
  @IsEnum(DocumentType, {
    message: 'El tipo de documento debe ser OFICIO o MEMORANDO',
  })
  @IsOptional()
  documentType?: DocumentType

  @ApiProperty({
    description: 'Categoría del documento',
    enum: DocumentCategory,
    example: 'NORMAL',
    required: false,
  })
  @IsEnum(DocumentCategory, {
    message: 'La categoría debe ser NORMAL o CIFRADO',
  })
  @IsOptional()
  category?: DocumentCategory

  @ApiProperty({
    description: 'Estado del documento',
    enum: DocumentStatus,
    example: 'ENVIADO',
    required: false,
  })
  @IsEnum(DocumentStatus, { message: 'El estado no es válido' })
  @IsOptional()
  status?: DocumentStatus

  @ApiProperty({
    description: 'Asunto del documento',
    example: 'Solicitud de información actualizada',
    type: String,
    required: false,
  })
  @IsString({ message: 'El asunto debe ser un texto' })
  @IsOptional()
  subject?: string

  @ApiProperty({
    description: 'Contenido HTML del documento para generar el PDF',
    example: '<h1>Mi Documento Actualizado</h1><p>Contenido actualizado...</p>',
    type: String,
    required: false,
  })
  @IsString({ message: 'El HTML debe ser un texto' })
  @IsOptional()
  html?: string

  @ApiProperty({
    description: 'ID del autor del documento',
    example: 1,
    type: Number,
    required: false,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined || value == 0) {
      return undefined
    }
    const num = Number(value)
    return isNaN(num) ? value : num
  })
  @IsInt({ message: 'El ID del autor debe ser un número entero' })
  @IsOptional()
  authorId?: number

  @ApiProperty({
    description: 'ID del documento padre (si es una respuesta)',
    example: 1,
    type: Number,
    required: false,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined || value == 0) {
      return undefined
    }
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  @IsInt({ message: 'El ID del documento padre debe ser un número entero' })
  @IsOptional()
  parentDocumentId?: number

  @ApiProperty({
    description: 'Fecha de envío del documento',
    example: '2024-12-06T10:00:00Z',
    type: String,
    required: false,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }
    return value
  })
  @IsDateString({}, { message: 'La fecha de envío debe ser una fecha válida' })
  @IsOptional()
  sendDate?: string

  @ApiProperty({
    description:
      'Contraseña para proteger el PDF (requerida si category es NORMAL y se actualiza el HTML)',
    example: 'miContraseña123',
    type: String,
    required: false,
  })
  @ValidateIf((o) => o.category === DocumentCategory.NORMAL)
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(4, {
    message: 'La contraseña debe tener al menos 4 caracteres',
  })
  @IsOptional()
  password?: string

  @ApiProperty({
    description: 'Firma QR del documento',
    example: 'firma-qr-123-actualizada',
    type: String,
    required: false,
  })
  @IsString({ message: 'La firma QR debe ser un texto' })
  @IsOptional()
  qrSignature?: string
}
