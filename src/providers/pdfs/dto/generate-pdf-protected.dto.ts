import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class GeneratePdfProtectedDto {
  @ApiProperty({
    description: 'Contenido HTML a convertir a PDF',
    example:
      '<h1>Documento Protegido</h1><p>Este es el contenido confidencial del documento PDF protegido...</p>',
    type: String,
  })
  @IsString({ message: 'El HTML debe ser un texto' })
  @IsNotEmpty({ message: 'El HTML es requerido' })
  html: string

  @ApiProperty({
    description: 'Contraseña para proteger el PDF',
    example: 'miContraseña123',
    type: String,
    minLength: 4,
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
  password: string

  @ApiProperty({
    description: 'Título del documento',
    example: 'Documento Protegido',
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
    example: 'Documento confidencial',
    type: String,
    required: false,
  })
  @IsString({ message: 'El asunto debe ser un texto' })
  @IsOptional()
  subject?: string

  @ApiProperty({
    description: 'Nombre personalizado del archivo (opcional)',
    example: 'documento-protegido.pdf',
    type: String,
    required: false,
  })
  @IsString({ message: 'El nombre del archivo debe ser un texto' })
  @IsOptional()
  filename?: string
}
