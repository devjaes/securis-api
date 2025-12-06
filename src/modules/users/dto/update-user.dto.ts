import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateUserDto {
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsOptional()
  email?: string

  @IsString({ message: 'El nombre debe ser un texto' })
  @IsOptional()
  name?: string

  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsOptional()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string
}
