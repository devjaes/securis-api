import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { CoreModule } from './core/core.module'
import { HealthController } from './health.controller'
import { AuthModule } from './features/auth/auth.module'
import { DocumentsModule } from './features/documents/documents.module'
import { PdfModule } from './providers/pdfs/pdf.module'
import { EncryptionModule } from './features/encryption'
import { ResponseInterceptor } from './shared/interceptors/response.interceptor'

@Module({
  imports: [
    CoreModule,
    AuthModule,
    DocumentsModule,
    PdfModule,
    EncryptionModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}
