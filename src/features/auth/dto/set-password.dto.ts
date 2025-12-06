import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SetPasswordDto {
  @ApiProperty({
    description: 'Nueva contraseña del usuario',
    example: 'MiNuevaContraseña123!',
    type: String,
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string

  @ApiProperty({
    description:
      'Email del usuario (requerido solo si es primera vez estableciendo contraseña)',
    example: 'usuario@example.com',
    type: String,
    required: false,
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsOptional()
  @IsString({ message: 'El email debe ser un texto' })
  email?: string

  @ApiProperty({
    description:
      'Indica si es la primera vez que el usuario establece su contraseña',
    example: true,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean({ message: 'isFirstTime debe ser un booleano' })
  @IsOptional()
  isFirstTime?: boolean
}
