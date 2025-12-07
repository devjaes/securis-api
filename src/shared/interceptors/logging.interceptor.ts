import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { Request, Response } from 'express'

interface LoggingData {
  timestamp: string
  method: string
  url: string
  ip: string
  userAgent: string
  userId: string | number
  contentType: string
  body: unknown
  query: unknown
  params: unknown
  headers: Record<string, string>
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    const startTime = Date.now()
    const requestId = this.generateRequestId()

    // Log incoming request
    const requestData = this.extractRequestData(request)
    this.logRequest(requestId, requestData)

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime
          this.logResponse(requestId, response.statusCode, duration, data)
        },
        error: (error) => {
          const duration = Date.now() - startTime
          this.logError(requestId, error, duration, requestData)
        },
      }),
    )
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private extractRequestData(request: Request): LoggingData {
    // Sanitize sensitive headers
    const sanitizedHeaders: Record<string, string> = {}
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']

    Object.entries(request.headers).forEach(([key, value]) => {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitizedHeaders[key] = '[REDACTED]'
      } else if (typeof value === 'string') {
        sanitizedHeaders[key] = value
      } else if (Array.isArray(value)) {
        sanitizedHeaders[key] = value.join(', ')
      }
    })

    // Sanitize body (remove sensitive fields)
    const sanitizedBody = this.sanitizeBody(request.body)

    return {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.originalUrl || request.url,
      ip: request.ip || request.connection?.remoteAddress || 'unknown',
      userAgent: request.headers['user-agent'] || 'unknown',
      userId: (request as any).user?.id || 'anonymous',
      contentType: request.headers['content-type'] || 'unknown',
      body: sanitizedBody,
      query: request.query,
      params: request.params,
      headers: sanitizedHeaders,
    }
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret']
    const sanitized = { ...body } as Record<string, unknown>

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }

  private logRequest(requestId: string, data: LoggingData): void {
    const logMessage = [
      `\n${'='.repeat(80)}`,
      `📥 INCOMING REQUEST [${requestId}]`,
      `${'='.repeat(80)}`,
      `⏰ Timestamp: ${data.timestamp}`,
      `🔗 ${data.method} ${data.url}`,
      `🌐 IP: ${data.ip}`,
      `👤 User: ${data.userId}`,
      `📝 Content-Type: ${data.contentType}`,
    ]

    // Log query params if present
    if (data.query && Object.keys(data.query).length > 0) {
      logMessage.push(`🔍 Query: ${JSON.stringify(data.query, null, 2)}`)
    }

    // Log route params if present
    if (data.params && Object.keys(data.params).length > 0) {
      logMessage.push(`📌 Params: ${JSON.stringify(data.params, null, 2)}`)
    }

    // Log body if present (truncate if too large)
    if (data.body && Object.keys(data.body).length > 0) {
      const bodyStr = JSON.stringify(data.body, null, 2)
      const truncatedBody =
        bodyStr.length > 2000
          ? bodyStr.substring(0, 2000) + '\n... [TRUNCATED]'
          : bodyStr
      logMessage.push(`📦 Body:\n${truncatedBody}`)
    }

    logMessage.push(`${'='.repeat(80)}`)

    this.logger.log(logMessage.join('\n'))
  }

  private logResponse(
    requestId: string,
    statusCode: number,
    duration: number,
    data: unknown,
  ): void {
    const statusEmoji = statusCode < 400 ? '✅' : statusCode < 500 ? '⚠️' : '❌'

    const logMessage = [
      `\n${'─'.repeat(80)}`,
      `📤 RESPONSE [${requestId}]`,
      `${'─'.repeat(80)}`,
      `${statusEmoji} Status: ${statusCode}`,
      `⏱️  Duration: ${duration}ms`,
    ]

    // Log response data (truncate if too large)
    if (data) {
      const dataStr = JSON.stringify(data, null, 2)
      const truncatedData =
        dataStr.length > 2000
          ? dataStr.substring(0, 2000) + '\n... [TRUNCATED]'
          : dataStr
      logMessage.push(`📦 Response:\n${truncatedData}`)
    }

    logMessage.push(`${'─'.repeat(80)}`)

    if (statusCode < 400) {
      this.logger.log(logMessage.join('\n'))
    } else {
      this.logger.warn(logMessage.join('\n'))
    }
  }

  private logError(
    requestId: string,
    error: any,
    duration: number,
    requestData: LoggingData,
  ): void {
    const logMessage = [
      `\n${'*'.repeat(80)}`,
      `❌ ERROR [${requestId}]`,
      `${'*'.repeat(80)}`,
      `⏱️  Duration: ${duration}ms`,
      `🚨 Error Type: ${error?.name || 'Unknown'}`,
      `💬 Message: ${error?.message || 'No message'}`,
    ]

    // Log validation errors specifically
    if (error?.response?.message) {
      const validationErrors = Array.isArray(error.response.message)
        ? error.response.message
        : [error.response.message]
      logMessage.push(`📋 Validation Errors:`)
      validationErrors.forEach((err: string, idx: number) => {
        logMessage.push(`   ${idx + 1}. ${err}`)
      })
    }

    // Log the request that caused the error
    logMessage.push(`\n📥 Failed Request:`)
    logMessage.push(`   Method: ${requestData.method}`)
    logMessage.push(`   URL: ${requestData.url}`)
    logMessage.push(`   User: ${requestData.userId}`)

    if (requestData.body && Object.keys(requestData.body).length > 0) {
      const bodyStr = JSON.stringify(requestData.body, null, 2)
      const truncatedBody =
        bodyStr.length > 1000
          ? bodyStr.substring(0, 1000) + '\n... [TRUNCATED]'
          : bodyStr
      logMessage.push(`   Body:\n${truncatedBody}`)
    }

    // Log stack trace in development
    if (process.env.NODE_ENV !== 'production' && error?.stack) {
      logMessage.push(`\n📚 Stack Trace:\n${error.stack}`)
    }

    logMessage.push(`${'*'.repeat(80)}`)

    this.logger.error(logMessage.join('\n'))
  }
}
