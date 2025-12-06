// backend/src/modules/documents/documents.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import * as fs from 'fs/promises'
import * as path from 'path'
import { HuffmanBackService } from '@/features/encryption/application/services/huffman-back.service'
import { PdfService } from '@/providers/pdfs/pdf.service'
import { DBService } from '@/core/database/database.service'
import { CreateDocumentDto, DocumentCategory } from './dto/create-document.dto'
import { UpdateDocumentDto } from './dto/update-document.dto'

@Injectable()
export class DocumentsService {
  constructor(
    private readonly databaseService: DBService,
    private readonly huffmanService: HuffmanBackService,
    private readonly pdfService: PdfService,
  ) {}

  async createDocument(
    dto: CreateDocumentDto,
    attachments?: Express.Multer.File[],
  ) {
    const prisma = this.databaseService.getAdminClient()

    try {
      // Validar contraseña si category es NORMAL
      if (dto.category === DocumentCategory.NORMAL && !dto.password) {
        throw new BadRequestException(
          'La contraseña es requerida cuando la categoría es NORMAL',
        )
      }

      // Procesar el body según la categoría
      let processedBody = dto.html
      if (dto.category === DocumentCategory.CIFRADO) {
        // Cifrar el contenido HTML
        console.log('dto.html', dto.html)
        processedBody = this.huffmanService.encode(dto.html)
        console.log('processedBody', processedBody)
      }

      // Generar el PDF según la categoría
      let pdfPath: string | null = null
      if (dto.category === DocumentCategory.NORMAL && dto.password) {
        // Generar PDF con contraseña
        pdfPath = await this.pdfService.generatePdfWithPassword(
          dto.html,
          dto.password,
          {
            title: dto.subject,
            author: `Usuario ID: ${dto.authorId}`,
            subject: dto.subject,
          },
        )
      } else if (dto.category === DocumentCategory.CIFRADO) {
        // Generar PDF sin contraseña (el contenido ya está cifrado)
        pdfPath = await this.pdfService.generatePdf(processedBody, {
          title: dto.subject,
          author: `Usuario ID: ${dto.authorId}`,
          subject: dto.subject,
        })
      }

      console.log(dto)

      // Crear el documento en la base de datos
      const document = await prisma.document.create({
        data: {
          documentType: dto.documentType,
          category: dto.category,
          status: dto.status || 'BORRADOR',
          subject: dto.subject,
          body: processedBody,
          authorId: dto.authorId,
          parentDocumentId: dto.parentDocumentId,
          sendDate: dto.sendDate ? new Date(dto.sendDate) : null,
          pdfPath,
          qrSignature: dto.qrSignature,
        },
      })

      // Guardar los adjuntos si existen
      const savedAttachments: Array<{
        id: number
        fileName: string
        filePath: string
        documentId: number
        createdAt: Date
      }> = []
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          // Validar que sea un PDF
          if (attachment.mimetype !== 'application/pdf') {
            throw new BadRequestException(
              `El archivo ${attachment.originalname} debe ser un PDF`,
            )
          }

          // Guardar el archivo
          const attachmentPath = await this.pdfService.saveAttachment(
            attachment.buffer,
            attachment.originalname,
          )

          // Crear el registro en la base de datos
          const attachmentRecord = await prisma.documentAttachment.create({
            data: {
              documentId: document.id,
              fileName: attachment.originalname,
              filePath: attachmentPath,
            },
          })

          savedAttachments.push(attachmentRecord)
        }
      }

      return {
        document,
        attachments: savedAttachments,
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException(
        error instanceof Error
          ? `Error al crear el documento: ${error.message}`
          : 'Error al crear el documento',
      )
    }
  }

  async getAllDocuments() {
    const prisma = this.databaseService.getAdminClient()

    try {
      const documents = await prisma.document.findMany({
        include: {
          attachments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return {
        documents,
        total: documents.length,
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? `Error al obtener los documentos: ${error.message}`
          : 'Error al obtener los documentos',
      )
    }
  }

  async getDocumentById(id: number) {
    const prisma = this.databaseService.getAdminClient()

    try {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          attachments: true,
        },
      })

      if (!document) {
        throw new BadRequestException(`Documento con ID ${id} no encontrado`)
      }

      return document
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException(
        error instanceof Error
          ? `Error al obtener el documento: ${error.message}`
          : 'Error al obtener el documento',
      )
    }
  }

  async updateDocument(id: number, dto: UpdateDocumentDto) {
    const prisma = this.databaseService.getAdminClient()

    try {
      // Verificar que el documento existe
      const existingDocument = await prisma.document.findUnique({
        where: { id },
      })

      if (!existingDocument) {
        throw new BadRequestException(`Documento con ID ${id} no encontrado`)
      }

      // Determinar la categoría a usar (la nueva o la existente)
      const category: DocumentCategory = dto.category
        ? dto.category
        : (existingDocument.category as DocumentCategory)

      // Validar contraseña si category es NORMAL y se está actualizando el HTML
      if (category === DocumentCategory.NORMAL && dto.html && !dto.password) {
        throw new BadRequestException(
          'La contraseña es requerida cuando se actualiza el HTML y la categoría es NORMAL',
        )
      }

      // Procesar el body si se actualiza el HTML
      let processedBody = existingDocument.body
      let pdfPath = existingDocument.pdfPath

      if (dto.html) {
        if (category === DocumentCategory.CIFRADO) {
          // Cifrar el contenido HTML
          processedBody = this.huffmanService.encode(dto.html)
        } else {
          processedBody = dto.html
        }

        // Regenerar el PDF si se actualiza el HTML
        if (category === DocumentCategory.NORMAL && dto.password) {
          // Generar PDF con contraseña
          pdfPath = await this.pdfService.generatePdfWithPassword(
            dto.html,
            dto.password,
            {
              title: dto.subject || existingDocument.subject,
              author: `Usuario ID: ${dto.authorId || existingDocument.authorId}`,
              subject: dto.subject || existingDocument.subject,
            },
          )
        } else if (category === DocumentCategory.CIFRADO) {
          // Generar PDF sin contraseña (el contenido ya está cifrado)
          pdfPath = await this.pdfService.generatePdf(processedBody, {
            title: dto.subject || existingDocument.subject,
            author: `Usuario ID: ${dto.authorId || existingDocument.authorId}`,
            subject: dto.subject || existingDocument.subject,
          })
        } else {
          // category === DocumentCategory.NORMAL sin contraseña
          // Si cambió de CIFRADO a NORMAL pero no hay contraseña, mantener el PDF anterior
          // O generar uno nuevo sin contraseña si no existe
          if (!pdfPath) {
            pdfPath = await this.pdfService.generatePdf(dto.html, {
              title: dto.subject || existingDocument.subject,
              author: `Usuario ID: ${dto.authorId || existingDocument.authorId}`,
              subject: dto.subject || existingDocument.subject,
            })
          }
        }
      } else if (
        dto.category &&
        dto.category !== (existingDocument.category as DocumentCategory)
      ) {
        // Si solo cambia la categoría pero no el HTML, actualizar el body si es necesario
        const existingCategory = existingDocument.category as DocumentCategory
        if (
          dto.category === DocumentCategory.CIFRADO &&
          existingCategory === DocumentCategory.NORMAL
        ) {
          // Cifrar el contenido existente
          processedBody = this.huffmanService.encode(existingDocument.body)
        } else if (
          dto.category === DocumentCategory.NORMAL &&
          existingCategory === DocumentCategory.CIFRADO
        ) {
          // No podemos descifrar sin el árbol, mantener cifrado o requerir HTML nuevo
          throw new BadRequestException(
            'Para cambiar de CIFRADO a NORMAL, debe proporcionar el nuevo HTML',
          )
        }
      }

      // Preparar los datos de actualización
      const updateData: {
        documentType?: string
        category?: string
        status?: string
        subject?: string
        body?: string
        authorId?: number
        parentDocumentId?: number | null
        sendDate?: Date | null
        pdfPath?: string | null
        qrSignature?: string | null
      } = {}

      if (dto.documentType !== undefined) {
        updateData.documentType = dto.documentType
      }
      if (dto.category !== undefined) {
        updateData.category = dto.category
      }
      if (dto.status !== undefined) {
        updateData.status = dto.status
      }
      if (dto.subject !== undefined) {
        updateData.subject = dto.subject
      }
      if (processedBody !== existingDocument.body) {
        updateData.body = processedBody
      }
      if (dto.authorId !== undefined) {
        updateData.authorId = dto.authorId
      }
      if (dto.parentDocumentId !== undefined) {
        updateData.parentDocumentId = dto.parentDocumentId || null
      }
      if (dto.sendDate !== undefined) {
        updateData.sendDate = dto.sendDate ? new Date(dto.sendDate) : null
      }
      if (pdfPath !== existingDocument.pdfPath) {
        updateData.pdfPath = pdfPath
      }
      if (dto.qrSignature !== undefined) {
        updateData.qrSignature = dto.qrSignature || null
      }

      // Actualizar el documento
      const updatedDocument = await prisma.document.update({
        where: { id },
        data: updateData,
        include: {
          attachments: true,
        },
      })

      return updatedDocument
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException(
        error instanceof Error
          ? `Error al actualizar el documento: ${error.message}`
          : 'Error al actualizar el documento',
      )
    }
  }

  async getPdfByPath(filePath: string): Promise<Buffer> {
    try {
      // Normalizar la ruta
      const normalizedPath = path.normalize(filePath)

      // Validar que no contenga path traversal peligroso
      if (normalizedPath.includes('..')) {
        throw new BadRequestException(
          'Ruta de archivo inválida: no se permiten rutas con ..',
        )
      }

      // Construir la ruta completa
      // Si es absoluta, usarla directamente; si es relativa, unirla con process.cwd()
      const fullPath = path.isAbsolute(normalizedPath)
        ? normalizedPath
        : path.join(process.cwd(), normalizedPath)

      // Verificar que el archivo existe
      try {
        await fs.access(fullPath)
      } catch {
        throw new NotFoundException(
          `Archivo PDF no encontrado en la ruta: ${filePath}`,
        )
      }

      // Leer el archivo
      const fileBuffer = await fs.readFile(fullPath)

      // Validar que sea un PDF (verificar el header)
      const pdfHeader = fileBuffer.slice(0, 4).toString()
      if (pdfHeader !== '%PDF') {
        throw new BadRequestException('El archivo no es un PDF válido')
      }

      return fileBuffer
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error
      }
      throw new BadRequestException(
        error instanceof Error
          ? `Error al leer el archivo PDF: ${error.message}`
          : 'Error al leer el archivo PDF',
      )
    }
  }
}
