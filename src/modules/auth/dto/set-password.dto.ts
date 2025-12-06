import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class SetPasswordDto {
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string

  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsOptional()
  @IsString({ message: 'El email debe ser un texto' })
  email?: string

  @IsBoolean({ message: 'isFirstTime debe ser un booleano' })
  @IsOptional()
  isFirstTime?: boolean
}
