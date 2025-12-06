import { HttpException } from '@nestjs/common'

export class BusinessException extends HttpException {
  constructor(message: string | string[], statusCode: number) {
    super(message, statusCode)
  }
}
