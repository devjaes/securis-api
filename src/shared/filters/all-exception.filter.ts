/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { BusinessException } from '../exceptions/business.exception'
import { ApiRes } from '../dtos/res/api-response.dto'
import { Prisma } from 'src/core/database/generated/client'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    const errorResponse: ApiRes<null> = {
      success: false,
      message: {
        content: ['Ocurrió un error inesperado'],
        displayable: true,
      },
      data: null,
    }

    // Extract exception details for logging
    const exceptionDetails = this.extractExceptionDetails(exception)

    // Enhanced logging with structured information
    this.logException(request, exceptionDetails, exception)

    if (exception instanceof BusinessException) {
      status = exception.getStatus()
      errorResponse.message.content = Array.isArray(exception.getResponse())
        ? (exception.getResponse() as string[])
        : [exception.getResponse() as string]
    }
    // Handle HttpExceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus()
      const errorMessage = exception.getResponse()

      errorResponse.message.displayable = false

      errorResponse.message.content = Array.isArray(errorMessage['message'])
        ? errorMessage['message']
        : [errorMessage['message'] || 'HTTP Error']
    }
    // Handle Prisma specific errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST
      errorResponse.message.displayable = false

      switch (exception.code) {
        case 'P2002': // Unique constraint violation
          errorResponse.message.content = [
            'Unique constraint violation on field',
          ]
          break
        case 'P2003': // Foreign key constraint violation
          errorResponse.message.content = ['Invalid related record']
          break
        case 'P2025': // Record not found
          status = HttpStatus.NOT_FOUND
          errorResponse.message.content = ['Record not found']
          break
        default:
          errorResponse.message.content = ['Database operation error']
      }
    }
    // Handle other types of errors
    else if (exception instanceof Error) {
      errorResponse.message.displayable = false

      errorResponse.message.content = [exception.message]
    }

    response.status(status).json(errorResponse)
  }

  private extractExceptionDetails(exception: any) {
    const { exception: _, ...rest } = exception

    return {
      name: exception?.name || 'Unknown',
      message: exception?.message || 'No message',
      stack: exception?.stack,
      code: exception?.code,
      meta: exception?.meta,
      ...rest,
    }
  }

  private logException(
    request: Request,
    exceptionDetails: any,
    originalException: any,
  ) {
    const logContext = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ip: request.ip || request.connection.remoteAddress,
      userId: (request as any).user?.id || 'anonymous',
      exceptionType: exceptionDetails.name,
      exceptionMessage: exceptionDetails.message,
      exceptionCode: exceptionDetails.code,
      exceptionMeta: exceptionDetails.meta,
      stack: exceptionDetails.stack,
    }

    // Log error with different levels based on exception type
    if (originalException instanceof BusinessException) {
      this.logger.warn('Displayable exception occurred', logContext)
    } else if (originalException instanceof HttpException) {
      this.logger.warn('HTTP exception occurred', logContext)
    } else if (
      originalException instanceof Prisma.PrismaClientKnownRequestError
    ) {
      this.logger.error('Prisma database error occurred', logContext)
    } else {
      this.logger.error('Unexpected error occurred', logContext)
    }

    // Additional detailed logging for debugging
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('Full exception details', {
        ...logContext,
        fullException: originalException,
      })
    }
  }
}
