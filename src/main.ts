import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger, ValidationPipe } from '@nestjs/common'
import { useContainer } from 'class-validator'
import { CustomConfigService } from './core/config/config.service'
import * as express from 'express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ApiPaginatedRes, ApiRes } from './shared/dtos/res/api-response.dto'
import { BaseParamsReqDto } from './shared/dtos/req/base-params.dto'
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor'
import { GlobalExceptionFilter } from './shared/filters/all-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })
  const configService = app.get(CustomConfigService)
  const port = configService.env.PORT

  // Configurar límites de body para peticiones grandes
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ limit: '50mb', extended: true }))
  app.use(express.text({ limit: '50mb' }))

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://localhost:5173',
      'https://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Enable global logging interceptor and exception filter
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.useGlobalFilters(new GlobalExceptionFilter())

  useContainer(app.select(AppModule), { fallbackOnErrors: true })

  const apiPrefix = configService.env.API_PREFIX
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  // })
  app.setGlobalPrefix(apiPrefix)

  // app.enableCors({
  //   origin: (
  //     origin: string | undefined,
  //     callback: (err: Error | null, allow?: boolean) => void,
  //   ) => {
  //     const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
  //     if (!origin || allowedOrigins.includes(origin)) {
  //       callback(null, true)
  //     } else {
  //       callback(new Error('Not allowed by CORS'))
  //     }
  //   },
  //   credentials: true,
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  //   exposedHeaders: ['Content-Type'],
  // })

  const config = new DocumentBuilder()
    .setTitle('Securis API')
    .setDescription(
      'Complete API documentation for Nest Prisma Base. This API is designed to provide a seamless experience for developers and users alike. It includes endpoints for authentication, user management and more.',
    )
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`, 'Local server')
    // .addServer('https://api.produccion.com', 'Production server')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter your JWT token',
      in: 'header',
    })
    .build()

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ApiRes, ApiPaginatedRes, BaseParamsReqDto],
  })

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none', // 'list', 'full', 'none'
      operationsSorter: 'method', // 'alpha', 'method'
      tagsSorter: 'alpha',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      filter: true,
      syntaxHighlight: {
        activate: true,
        theme: 'agate',
      },
    },
    customSiteTitle: 'Securis API Documentation',
    // customfavIcon: 'https://nestjs.com/favicon.ico',
    customCss: `
        .swagger-ui .information-container { padding: 20px 0 }
        .swagger-ui .scheme-container { padding: 15px 0 }
      `,
  })

  await app.listen(port)

  Logger.log(`Server running on port ${port}`, 'Bootstrap')
  Logger.log(
    `Swagger docs available at: http://localhost:${port}/api/docs`,
    'Bootstrap',
  )
  Logger.log(
    'API versioning enabled. Use /api/v1/ to access the API.',
    'Bootstrap',
  )
}

void bootstrap()
