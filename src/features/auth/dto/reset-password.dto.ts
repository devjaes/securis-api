import { IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de restablecimiento de contraseña recibido por email',
    example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    type: String,
  })
  @IsString({ message: 'El token debe ser un texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string

  @ApiProperty({
    description: 'Nueva contraseña del usuario',
    example: 'NuevaContraseña123!',
    type: String,
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string
}
