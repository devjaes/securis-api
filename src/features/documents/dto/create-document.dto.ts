import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  IsEmail,
  IsArray,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export enum DocumentType {
  OFICIO = 'OFICIO',
  MEMORANDO = 'MEMORANDO',
}

export enum DocumentCategory {
  NORMAL = 'NORMAL',
  CIFRADO = 'CIFRADO',
}

export enum DocumentStatus {
  BORRADOR = 'BORRADOR',
  EN_ELABORACION = 'EN_ELABORACION',
  ENVIADO = 'ENVIADO',
  NO_ENVIADO = 'NO_ENVIADO',
}

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: 'OFICIO',
  })
  @IsEnum(DocumentType, {
    message: 'El tipo de documento debe ser OFICIO o MEMORANDO',
  })
  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  documentType: DocumentType

  @ApiProperty({
    description: 'Categoría del documento',
    enum: DocumentCategory,
    example: 'NORMAL',
  })
  @IsEnum(DocumentCategory, {
    message: 'La categoría debe ser NORMAL o CIFRADO',
  })
  @IsNotEmpty({ message: 'La categoría es requerida' })
  category: DocumentCategory

  @ApiProperty({
    description: 'Estado del documento',
    enum: DocumentStatus,
    example: 'BORRADOR',
    required: false,
  })
  @IsEnum(DocumentStatus, { message: 'El estado no es válido' })
  @IsOptional()
  status?: DocumentStatus

  @ApiProperty({
    description: 'Asunto del documento',
    example: 'Solicitud de información',
    type: String,
  })
  @IsString({ message: 'El asunto debe ser un texto' })
  @IsNotEmpty({ message: 'El asunto es requerido' })
  subject: string

  @ApiProperty({
    description: 'Contenido HTML del documento para generar el PDF',
    example: '<h1>Mi Documento</h1><p>Contenido del documento...</p>',
    type: String,
  })
  @IsString({ message: 'El HTML debe ser un texto' })
  @IsNotEmpty({ message: 'El HTML es requerido' })
  html: string

  @ApiProperty({
    description: 'ID del autor del documento',
    example: 1,
    type: Number,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }
    const num = Number(value)
    return isNaN(num) ? value : num
  })
  @IsInt({ message: 'El ID del autor debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID del autor es requerido' })
  authorId: number

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
      'Contraseña para proteger el PDF (requerida si category es NORMAL)',
    example: 'miContraseña123',
    type: String,
    required: false,
  })
  @ValidateIf((o) => o.category === DocumentCategory.NORMAL)
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(4, {
    message: 'La contraseña debe tener al menos 4 caracteres',
  })
  @IsNotEmpty({
    message: 'La contraseña es requerida cuando la categoría es NORMAL',
  })
  password?: string

  @ApiProperty({
    description: 'Firma QR del documento',
    example: 'firma-qr-123',
    type: String,
    required: false,
  })
  @IsString({ message: 'La firma QR debe ser un texto' })
  @IsOptional()
  qrSignature?: string

  @ApiProperty({
    description: 'Lista de correos electrónicos de los destinatarios',
    example: ['usuario1@uta.edu.ec', 'usuario2@uta.edu.ec'],
    type: [String],
    required: false,
  })
  @IsArray({ message: 'Los destinatarios deben ser un array' })
  @IsEmail({}, { each: true, message: 'Cada correo debe ser válido' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }
    return value.split(',').map((email) => email.trim())
  })
  recipientEmails?: string[]
}
