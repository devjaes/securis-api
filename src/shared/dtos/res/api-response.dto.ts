import { ApiProperty } from '@nestjs/swagger'

export class ApiMessage {
  @ApiProperty({
    type: [String],
    description: 'Array of messages to be displayed',
    example: ['Successful operation'],
  })
  content: string[]

  @ApiProperty({
    type: Boolean,
    description: 'Indicates if the message should be displayed to the user',
    example: true,
  })
  displayable: boolean
}

export class ApiRes<T> {
  @ApiProperty({
    type: Boolean,
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean

  @ApiProperty({
    type: ApiMessage,
    description: 'Message returned from the API',
    example: {
      content: ['Successful operation'],
      displayable: true,
    },
  })
  message: ApiMessage

  @ApiProperty({
    description: 'Generic data returned from the API, can be null',
    nullable: true,
    // Type se definirá dinámicamente en los decoradores
  })
  data: T | null
}

export class ApiPaginatedRes<T> {
  @ApiProperty({
    description: 'Array of records',
    isArray: true,
    // Swagger inferirá el tipo desde el decorador
  })
  records: T[]

  @ApiProperty({
    type: Number,
    description: 'Total number of records',
    example: 100,
  })
  total: number

  @ApiProperty({
    type: Number,
    description: 'Number of records per page',
    example: 10,
  })
  limit: number

  @ApiProperty({
    type: Number,
    description: 'Current page number',
    example: 1,
  })
  page: number

  @ApiProperty({
    type: Number,
    description: 'Total number of pages',
    example: 10,
  })
  pages: number
}

export class ApiCustomRes<T> {
  @ApiProperty({
    description: 'Data returned from the API',
    type: Object,
    nullable: true,
  })
  data: T

  @ApiProperty({
    description: 'Custom message returned from the API',
    type: ApiMessage,
    nullable: true,
  })
  customMessage?: ApiMessage
}
