import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class GeneratePdfDto {
  @ApiProperty({
    description: 'Contenido HTML a convertir a PDF',
    example:
      '<h1>Mi Documento</h1><p>Este es el contenido del documento PDF que se va a generar...</p>',
    type: String,
  })
  @IsString({ message: 'El HTML debe ser un texto' })
  @IsNotEmpty({ message: 'El HTML es requerido' })
  html: string

  @ApiProperty({
    description: 'Título del documento',
    example: 'Mi Documento',
    type: String,
    required: false,
  })
  @IsString({ message: 'El título debe ser un texto' })
  @IsOptional()
  title?: string

  @ApiProperty({
    description: 'Autor del documento',
    example: 'Juan Pérez',
    type: String,
    required: false,
  })
  @IsString({ message: 'El autor debe ser un texto' })
  @IsOptional()
  author?: string

  @ApiProperty({
    description: 'Asunto del documento',
    example: 'Documento de ejemplo',
    type: String,
    required: false,
  })
  @IsString({ message: 'El asunto debe ser un texto' })
  @IsOptional()
  subject?: string

  @ApiProperty({
    description: 'Nombre personalizado del archivo (opcional)',
    example: 'mi-documento.pdf',
    type: String,
    required: false,
  })
  @IsString({ message: 'El nombre del archivo debe ser un texto' })
  @IsOptional()
  filename?: string
}
