// backend/src/modules/documents/documents.module.ts

import { Module } from '@nestjs/common'
import { DocumentsService } from './documents.service'
import { DocumentsController } from './documents.controller'
import { EncryptionModule } from '../encryption'
import { PdfModule } from '@/providers/pdfs/pdf.module'

@Module({
  imports: [EncryptionModule, PdfModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
