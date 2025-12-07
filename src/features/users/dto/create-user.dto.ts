import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@uta.edu.ec',
    type: String,
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
    type: String,
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string

  // La contraseña se establece después, no en la creación inicial
}
