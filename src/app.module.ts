import { Module } from '@nestjs/common'
import { CoreModule } from './core/core.module'
import { HealthController } from './health.controller'
import { AuthModule } from './features/auth/auth.module'
import { DocumentsModule } from './features/documents/documents.module'
import { PdfModule } from './providers/pdfs/pdf.module'

@Module({
  imports: [CoreModule, AuthModule, DocumentsModule, PdfModule],
  controllers: [HealthController],
  providers: [
    // ResponseInterceptor,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}
