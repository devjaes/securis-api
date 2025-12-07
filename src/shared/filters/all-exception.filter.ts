/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ArgumentsHost,
  BadRequestException,
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
  private readonly logger = new Logger('ExceptionFilter')

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
    // Handle BadRequestException (validation errors)
    else if (exception instanceof BadRequestException) {
      status = exception.getStatus()
      const errorMessage = exception.getResponse() as any

      errorResponse.message.displayable = false

      // Log validation errors in detail
      this.logValidationError(request, errorMessage)

      errorResponse.message.content = Array.isArray(errorMessage?.message)
        ? errorMessage.message
        : [errorMessage?.message || 'Bad Request']
    }
    // Handle other HttpExceptions
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
      response: exception?.response,
      ...rest,
    }
  }

  private logValidationError(request: Request, errorResponse: any): void {
    const logMessage = [
      `\n${'!'.repeat(80)}`,
      `🚫 VALIDATION ERROR`,
      `${'!'.repeat(80)}`,
      `⏰ Timestamp: ${new Date().toISOString()}`,
      `🔗 ${request.method} ${request.originalUrl || request.url}`,
      `👤 User: ${(request as any).user?.id || 'anonymous'}`,
    ]

    // Log validation messages
    if (errorResponse?.message) {
      const messages = Array.isArray(errorResponse.message)
        ? errorResponse.message
        : [errorResponse.message]

      logMessage.push(`\n📋 Validation Errors:`)
      messages.forEach((msg: string, idx: number) => {
        logMessage.push(`   ${idx + 1}. ${msg}`)
      })
    }

    // Log the request body that failed validation
    if (request.body) {
      const sanitizedBody = this.sanitizeBody(request.body)
      const bodyStr = JSON.stringify(sanitizedBody, null, 2)
      const truncatedBody =
        bodyStr.length > 2000
          ? bodyStr.substring(0, 2000) + '\n... [TRUNCATED]'
          : bodyStr
      logMessage.push(`\n📦 Request Body:\n${truncatedBody}`)
    }

    // Log files if present (multipart/form-data)
    if ((request as any).files) {
      const files = (request as any).files
      logMessage.push(`\n📎 Files: ${files.length} file(s) uploaded`)
      files.forEach((file: any, idx: number) => {
        logMessage.push(
          `   ${idx + 1}. ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
        )
      })
    }

    // Log Content-Type
    logMessage.push(
      `\n📝 Content-Type: ${request.headers['content-type'] || 'unknown'}`,
    )

    logMessage.push(`${'!'.repeat(80)}`)

    this.logger.error(logMessage.join('\n'))
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret']
    const sanitized = { ...body }

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }

  private logException(
    request: Request,
    exceptionDetails: any,
    originalException: any,
  ) {
    const logMessage = [
      `\n${'#'.repeat(80)}`,
      `💥 EXCEPTION CAUGHT`,
      `${'#'.repeat(80)}`,
      `⏰ Timestamp: ${new Date().toISOString()}`,
      `🔗 ${request.method} ${request.originalUrl || request.url}`,
      `🌐 IP: ${request.ip || request.connection?.remoteAddress || 'unknown'}`,
      `👤 User: ${(request as any).user?.id || 'anonymous'}`,
      `\n🚨 Exception Details:`,
      `   Type: ${exceptionDetails.name}`,
      `   Message: ${exceptionDetails.message}`,
    ]

    if (exceptionDetails.code) {
      logMessage.push(`   Code: ${exceptionDetails.code}`)
    }

    if (exceptionDetails.meta) {
      logMessage.push(`   Meta: ${JSON.stringify(exceptionDetails.meta)}`)
    }

    // Log response details if present
    if (exceptionDetails.response) {
      const responseStr =
        typeof exceptionDetails.response === 'object'
          ? JSON.stringify(exceptionDetails.response, null, 2)
          : exceptionDetails.response
      logMessage.push(`\n📤 Exception Response:\n${responseStr}`)
    }

    // Log stack trace
    if (exceptionDetails.stack) {
      const stackLines = exceptionDetails.stack.split('\n').slice(0, 10)
      logMessage.push(`\n📚 Stack Trace (first 10 lines):`)
      stackLines.forEach((line: string) => {
        logMessage.push(`   ${line}`)
      })
    }

    logMessage.push(`${'#'.repeat(80)}`)

    // Log based on exception type
    if (
      originalException instanceof BusinessException ||
      originalException instanceof HttpException
    ) {
      this.logger.warn(logMessage.join('\n'))
    } else {
      this.logger.error(logMessage.join('\n'))
    }
  }
}
