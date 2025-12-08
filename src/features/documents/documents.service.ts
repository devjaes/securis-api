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
import {
  CreateDocumentDto,
  DocumentCategory,
  DocumentStatus,
} from './dto/create-document.dto'
import { UpdateDocumentDto } from './dto/update-document.dto'

@Injectable()
export class DocumentsService {
  private readonly uploadsBaseDir = path.join(process.cwd(), 'uploads')

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
      // Si se está enviando un documento (status = ENVIADO) y hay un draftId,
      // o si no hay draftId pero existe un borrador reciente, actualizar en lugar de crear
      if (dto.status === DocumentStatus.ENVIADO) {
        let draftToUpdate: {
          id: number
          documentType: string
          category: string
          status: string
          subject: string
          body: string
          authorId: number
          parentDocumentId: number | null
          sendDate: Date | null
          pdfPath: string | null
          qrSignature: string | null
          createdAt: Date
          updatedAt: Date
        } | null = null

        // Caso 1: Se proporciona draftId explícitamente
        if (dto.draftId) {
          const foundDraft = await prisma.document.findFirst({
            where: {
              id: dto.draftId,
              authorId: dto.authorId,
              status: DocumentStatus.BORRADOR,
            },
          })

          if (!foundDraft) {
            throw new BadRequestException(
              `No se encontró un borrador con ID ${dto.draftId} del autor ${dto.authorId}`,
            )
          }

          draftToUpdate = foundDraft
        } else {
          // Caso 2: Buscar un borrador reciente del mismo autor con el mismo subject y parentDocumentId
          // Buscar en las últimas 24 horas
          const oneDayAgo = new Date()
          oneDayAgo.setHours(oneDayAgo.getHours() - 24)

          draftToUpdate = await prisma.document.findFirst({
            where: {
              authorId: dto.authorId,
              status: DocumentStatus.BORRADOR,
              subject: dto.subject,
              parentDocumentId: dto.parentDocumentId || null,
              createdAt: {
                gte: oneDayAgo,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        }

        // Si encontramos un borrador, actualizarlo en lugar de crear uno nuevo
        if (draftToUpdate !== null) {
          // Usar updateDocument para actualizar el borrador
          const updateDto: UpdateDocumentDto = {
            documentType: dto.documentType,
            category: dto.category,
            status: DocumentStatus.ENVIADO,
            subject: dto.subject,
            html: dto.html,
            authorId: dto.authorId,
            parentDocumentId: dto.parentDocumentId,
            sendDate: dto.sendDate || new Date().toISOString(),
            password: dto.password,
            qrSignature: dto.qrSignature,
            includeSignature: dto.includeSignature,
            recipientEmails: dto.recipientEmails,
          }

          // Actualizar el documento existente
          const updatedDocument = await this.updateDocument(
            draftToUpdate.id,
            updateDto,
          )

          // Manejar adjuntos si existen
          if (attachments && attachments.length > 0) {
            for (const attachment of attachments) {
              if (attachment.mimetype !== 'application/pdf') {
                throw new BadRequestException(
                  `El archivo ${attachment.originalname} debe ser un PDF`,
                )
              }

              const attachmentPath = await this.pdfService.saveAttachment(
                attachment.buffer,
                attachment.originalname,
              )

              await prisma.documentAttachment.create({
                data: {
                  documentId: updatedDocument.id,
                  fileName: attachment.originalname,
                  filePath: attachmentPath,
                },
              })
            }
          }

          // Obtener el documento actualizado con todas sus relaciones
          const finalDocument = await prisma.document.findUnique({
            where: { id: updatedDocument.id },
            include: {
              author: true,
              attachments: true,
              recipients: {
                include: {
                  recipient: true,
                },
              },
            },
          })

          return {
            document: finalDocument,
            attachments: finalDocument?.attachments || [],
            recipients: finalDocument?.recipients || [],
          }
        }
      }

      // Validar contraseña si category es NORMAL
      if (dto.category === DocumentCategory.NORMAL && !dto.password) {
        throw new BadRequestException(
          'La contraseña es requerida cuando la categoría es NORMAL',
        )
      }

      // Obtener información del autor para la firma QR
      let authorInfo: {
        name: string | null
        email: string
        id: number
      } | null = null
      let htmlWithSignature = dto.html

      // Si se solicita incluir firma, generar QR y reemplazar placeholder
      if (dto.includeSignature) {
        const author = await prisma.user.findUnique({
          where: { id: dto.authorId },
          select: { id: true, name: true, email: true },
        })

        if (!author) {
          throw new BadRequestException(
            `No se encontró el autor con ID ${dto.authorId}`,
          )
        }

        authorInfo = {
          id: author.id,
          name: author.name,
          email: author.email,
        }

        // Generar QR con información del remitente
        const qrDataUrl = await this.pdfService.generateSignatureQR(authorInfo)

        // Reemplazar {{signature}} en el HTML
        htmlWithSignature = this.pdfService.replaceSignaturePlaceholder(
          dto.html,
          qrDataUrl,
        )
      }

      // Procesar el body según la categoría (usar HTML con firma si aplica)
      let processedBody = htmlWithSignature
      if (dto.category === DocumentCategory.CIFRADO) {
        // Cifrar el contenido HTML
        processedBody = this.huffmanService.encode(htmlWithSignature)
      }

      // Generar el PDF según la categoría (usar HTML con firma si aplica)
      let pdfPath: string | null = null
      const htmlForPdf = htmlWithSignature // Usar HTML con firma si se incluyó
      if (dto.category === DocumentCategory.NORMAL && dto.password) {
        // Generar PDF con contraseña
        pdfPath = await this.pdfService.generatePdfWithPassword(
          htmlForPdf,
          dto.password,
          {
            title: dto.subject,
            author: authorInfo
              ? `${authorInfo.name || 'Usuario'} (${authorInfo.email})`
              : `Usuario ID: ${dto.authorId}`,
            subject: dto.subject,
          },
        )
      } else if (dto.category === DocumentCategory.CIFRADO) {
        // Generar PDF sin contraseña (el contenido ya está cifrado)
        pdfPath = await this.pdfService.generatePdf(processedBody, {
          title: dto.subject,
          author: authorInfo
            ? `${authorInfo.name || 'Usuario'} (${authorInfo.email})`
            : `Usuario ID: ${dto.authorId}`,
          subject: dto.subject,
        })
      }

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
        include: {
          author: true,
          attachments: true,
          recipients: {
            include: {
              recipient: true,
            },
          },
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

      // Procesar recipients si se proporcionaron emails
      const savedRecipients: Array<{
        id: number
        documentId: number
        recipientId: number
        isRead: boolean
        readDate: Date | null
        createdAt: Date
      }> = []
      if (dto.recipientEmails && dto.recipientEmails.length > 0) {
        for (const email of dto.recipientEmails) {
          // Verificar si el usuario existe
          let user = await prisma.user.findUnique({
            where: { email },
          })

          console.log(user)

          // Si no existe, crear el usuario
          if (!user) {
            // Extraer nombre del email (parte antes del @) como nombre por defecto
            const defaultName = email.split('@')[0] || 'Usuario'

            console.log(defaultName)

            user = await prisma.user.create({
              data: {
                email,
                name: defaultName,
                passwordHash: null,
              },
            })
          }

          // Validar que los IDs sean válidos antes de crear el recipient
          if (!document.id || document.id === 0) {
            throw new BadRequestException(
              `Error: document.id es inválido (${document.id})`,
            )
          }
          if (!user.id || user.id === 0) {
            throw new BadRequestException(
              `Error: user.id es inválido (${user.id}) para el email ${email}`,
            )
          }

          // Crear el registro de recipient
          const recipientRecord = await prisma.documentRecipient.create({
            data: {
              documentId: document.id,
              recipientId: user.id,
            },
            include: {
              recipient: true,
            },
          })

          savedRecipients.push(recipientRecord)
        }
      }

      return {
        document,
        attachments: savedAttachments,
        recipients: savedRecipients,
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

  async getAllDocuments(userId: number) {
    const prisma = this.databaseService.getAdminClient()

    try {
      const documents = await prisma.document.findMany({
        where: {
          authorId: userId,
        },
        include: {
          author: true,
          attachments: true,
          recipients: {
            include: {
              recipient: true,
            },
          },
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

  async getDocumentsByStatus(status: DocumentStatus, userId: number) {
    const prisma = this.databaseService.getAdminClient()

    try {
      // Filtrar solo documentos donde el usuario es el autor, no donde es destinatario
      const documents = await prisma.document.findMany({
        where: {
          status,
          authorId: userId, // Solo documentos del usuario como autor
        },
        include: {
          author: true,
          attachments: true,
          recipients: {
            include: {
              recipient: true,
            },
          },
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
          ? `Error al obtener los documentos en estado ${status}: ${error.message}`
          : `Error al obtener los documentos en estado ${status}`,
      )
    }
  }

  async getDocumentsByRecibido(userId: number) {
    const prisma = this.databaseService.getAdminClient()

    try {
      // Buscar primero en document_recipients por recipient_id
      const documentRecipients = await prisma.documentRecipient.findMany({
        where: {
          recipientId: userId,
          document: {
            status: DocumentStatus.ENVIADO,
          },
        },
        include: {
          document: {
            include: {
              author: true,
              attachments: true,
              recipients: {
                include: {
                  recipient: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Extraer los documentos de los registros de recipients
      const documents = documentRecipients.map((dr) => dr.document)

      return {
        documents,
        total: documents.length,
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? `Error al obtener los documentos recibidos: ${error.message}`
          : 'Error al obtener los documentos recibidos',
      )
    }
  }

  async getDocumentById(id: number) {
    const prisma = this.databaseService.getAdminClient()

    try {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          author: true,
          attachments: true,
          recipients: {
            include: {
              recipient: true,
            },
          },
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

      // Obtener información del autor para la firma QR si se solicita
      let authorInfo: {
        name: string | null
        email: string
        id: number
      } | null = null
      let htmlWithSignature = dto.html

      if (dto.html) {
        // Si se solicita incluir firma, generar QR y reemplazar placeholder
        if (dto.includeSignature) {
          const authorId = dto.authorId || existingDocument.authorId
          const author = await prisma.user.findUnique({
            where: { id: authorId },
            select: { id: true, name: true, email: true },
          })

          if (!author) {
            throw new BadRequestException(
              `No se encontró el autor con ID ${authorId}`,
            )
          }

          authorInfo = {
            id: author.id,
            name: author.name,
            email: author.email,
          }

          // Generar QR con información del remitente
          const qrDataUrl =
            await this.pdfService.generateSignatureQR(authorInfo)

          // Reemplazar {{signature}} en el HTML
          htmlWithSignature = this.pdfService.replaceSignaturePlaceholder(
            dto.html,
            qrDataUrl,
          )
        } else {
          htmlWithSignature = dto.html
        }

        if (category === DocumentCategory.CIFRADO) {
          // Cifrar el contenido HTML
          processedBody = this.huffmanService.encode(htmlWithSignature)
        } else {
          processedBody = htmlWithSignature
        }

        // Regenerar el PDF si se actualiza el HTML
        if (category === DocumentCategory.NORMAL && dto.password) {
          // Generar PDF con contraseña
          pdfPath = await this.pdfService.generatePdfWithPassword(
            htmlWithSignature,
            dto.password,
            {
              title: dto.subject || existingDocument.subject,
              author: authorInfo
                ? `${authorInfo.name || 'Usuario'} (${authorInfo.email})`
                : `Usuario ID: ${dto.authorId || existingDocument.authorId}`,
              subject: dto.subject || existingDocument.subject,
            },
          )
        } else if (category === DocumentCategory.CIFRADO) {
          // Generar PDF sin contraseña (el contenido ya está cifrado)
          pdfPath = await this.pdfService.generatePdf(processedBody, {
            title: dto.subject || existingDocument.subject,
            author: authorInfo
              ? `${authorInfo.name || 'Usuario'} (${authorInfo.email})`
              : `Usuario ID: ${dto.authorId || existingDocument.authorId}`,
            subject: dto.subject || existingDocument.subject,
          })
        } else {
          // category === DocumentCategory.NORMAL sin contraseña
          // Si cambió de CIFRADO a NORMAL pero no hay contraseña, mantener el PDF anterior
          // O generar uno nuevo sin contraseña si no existe
          if (!pdfPath) {
            pdfPath = await this.pdfService.generatePdf(htmlWithSignature, {
              title: dto.subject || existingDocument.subject,
              author: authorInfo
                ? `${authorInfo.name || 'Usuario'} (${authorInfo.email})`
                : `Usuario ID: ${dto.authorId || existingDocument.authorId}`,
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
          author: true,
          attachments: true,
          recipients: {
            include: {
              recipient: true,
            },
          },
        },
      })

      // Procesar recipients si se proporcionaron emails
      if (dto.recipientEmails && dto.recipientEmails.length > 0) {
        // Eliminar recipients existentes si se están actualizando
        await prisma.documentRecipient.deleteMany({
          where: {
            documentId: id,
          },
        })

        // Crear los nuevos recipients
        for (const email of dto.recipientEmails) {
          // Verificar si el usuario existe
          let user = await prisma.user.findUnique({
            where: { email },
          })

          // Si no existe, crear el usuario
          if (!user) {
            // Extraer nombre del email (parte antes del @) como nombre por defecto
            const defaultName = email.split('@')[0] || 'Usuario'

            user = await prisma.user.create({
              data: {
                email,
                name: defaultName,
                passwordHash: null,
              },
            })
          }

          // Validar que los IDs sean válidos antes de crear el recipient
          if (!id || id === 0) {
            throw new BadRequestException(
              `Error: document.id es inválido (${id})`,
            )
          }
          if (!user.id || user.id === 0) {
            throw new BadRequestException(
              `Error: user.id es inválido (${user.id}) para el email ${email}`,
            )
          }

          // Crear el registro de recipient
          await prisma.documentRecipient.create({
            data: {
              documentId: id,
              recipientId: user.id,
            },
          })
        }

        // Obtener el documento actualizado con los nuevos recipients
        const documentWithRecipients = await prisma.document.findUnique({
          where: { id },
          include: {
            author: true,
            attachments: true,
            recipients: {
              include: {
                recipient: true,
              },
            },
          },
        })

        return documentWithRecipients || updatedDocument
      }

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

  /**
   * Valida y resuelve una ruta de archivo de forma segura
   * Acepta rutas relativas que empiecen con 'documents/' o rutas absolutas dentro del directorio de uploads
   * @param filePath - Ruta del archivo a validar
   * @returns Ruta completa y validada del archivo
   * @throws BadRequestException si la ruta es inválida o insegura
   */
  private validateAndResolveFilePath(filePath: string): string {
    // 1. Validar entrada
    if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
      throw new BadRequestException('La ruta del archivo es requerida')
    }

    // 2. Validar contra Path Traversal (antes de normalizar)
    if (filePath.includes('..') || filePath.includes('\\')) {
      throw new BadRequestException(
        'Ruta de archivo inválida: se detectó intento de path traversal',
      )
    }

    // 3. Validar caracteres NULL
    if (filePath.includes('\0')) {
      throw new BadRequestException(
        'Ruta de archivo inválida: contiene caracteres no permitidos',
      )
    }

    let fullPath: string

    // 4. Determinar si es ruta absoluta o relativa
    if (path.isAbsolute(filePath)) {
      // Ruta absoluta: validar que esté dentro del directorio base de uploads
      const resolvedPath = path.resolve(filePath)
      const resolvedBase = path.resolve(this.uploadsBaseDir)

      if (!resolvedPath.startsWith(resolvedBase)) {
        throw new BadRequestException(
          'Ruta de archivo inválida: la ruta está fuera del directorio permitido',
        )
      }

      fullPath = resolvedPath
    } else {
      // Ruta relativa: normalizar y agregar prefijo 'documents/' si no lo tiene
      let normalizedPath = path.normalize(filePath)

      // Si la ruta no empieza con 'documents/', agregarlo automáticamente
      // Esto permite aceptar tanto 'documents/file.pdf' como 'file.pdf'
      if (!normalizedPath.startsWith('documents/')) {
        // Validar que no sea una ruta que intente salir del directorio
        if (
          normalizedPath.startsWith('../') ||
          normalizedPath.startsWith('..\\')
        ) {
          throw new BadRequestException(
            'Ruta de archivo inválida: se detectó intento de path traversal',
          )
        }
        normalizedPath = path.join('documents', normalizedPath)
      }

      // Construir la ruta completa desde el directorio base de uploads
      fullPath = path.join(this.uploadsBaseDir, normalizedPath)
    }

    // 5. Resolver y normalizar la ruta final para prevenir path traversal
    const resolvedPath = path.resolve(fullPath)
    const resolvedBase = path.resolve(this.uploadsBaseDir)

    // 6. Validar que la ruta final esté dentro del directorio base
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new BadRequestException(
        'Ruta de archivo inválida: la ruta está fuera del directorio permitido',
      )
    }

    return resolvedPath
  }

  /**
   * Obtiene el documento por su pdfPath y verifica si el usuario tiene permisos
   */
  async getDocumentByPdfPath(
    pdfPath: string,
    userId: number,
  ): Promise<{
    document: {
      id: number
      category: string
      body: string
      subject: string
      authorId: number
    }
    isAuthorized: boolean
  }> {
    const prisma = this.databaseService.getAdminClient()

    // Normalizar la ruta para comparación (resolver rutas absolutas y relativas)
    const normalizedPath = path.resolve(pdfPath)

    // Buscar todos los documentos y comparar rutas normalizadas
    const allDocuments = await prisma.document.findMany({
      where: {
        pdfPath: {
          not: null,
        },
      },
      select: {
        id: true,
        category: true,
        body: true,
        subject: true,
        authorId: true,
        pdfPath: true,
        recipients: {
          select: {
            recipientId: true,
          },
        },
      },
    })

    // Buscar el documento que coincida con la ruta normalizada
    const document = allDocuments.find((doc) => {
      if (!doc.pdfPath) return false
      const docPath = path.resolve(doc.pdfPath)
      return docPath === normalizedPath
    })

    if (!document) {
      throw new NotFoundException('Documento no encontrado')
    }

    // Verificar si el usuario es autor o destinatario
    const isAuthor = document.authorId === userId
    const isRecipient = document.recipients.some(
      (r) => r.recipientId === userId,
    )
    const isAuthorized = isAuthor || isRecipient

    if (!isAuthorized) {
      throw new BadRequestException(
        'No tienes permisos para acceder a este documento',
      )
    }

    return {
      document: {
        id: document.id,
        category: document.category,
        body: document.body,
        subject: document.subject,
        authorId: document.authorId,
      },
      isAuthorized,
    }
  }

  /**
   * Genera un PDF temporal descifrado para documentos CIFRADOS
   */
  async generateDecryptedPdf(
    encryptedBody: string,
    subject: string,
    authorId: number,
  ): Promise<Buffer> {
    try {
      // Descifrar el contenido
      const decryptedHtml = this.huffmanService.decode(encryptedBody)

      // Obtener información del autor para el PDF
      const prisma = this.databaseService.getAdminClient()
      const author = await prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true, name: true, email: true },
      })

      const authorInfo = author
        ? `${author.name || 'Usuario'} (${author.email})`
        : `Usuario ID: ${authorId}`

      // Generar PDF temporal en memoria (no guardarlo en disco)
      const tempPdfPath = await this.pdfService.generatePdf(decryptedHtml, {
        title: subject,
        author: authorInfo,
        subject,
      })

      // Leer el PDF generado
      const pdfBuffer = await fs.readFile(tempPdfPath)

      // Eliminar el archivo temporal
      try {
        await fs.unlink(tempPdfPath)
      } catch (error) {
        // Ignorar errores al eliminar el archivo temporal
        console.warn(
          `No se pudo eliminar el archivo temporal ${tempPdfPath}:`,
          error,
        )
      }

      return pdfBuffer
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? `Error al generar PDF descifrado: ${error.message}`
          : 'Error al generar PDF descifrado',
      )
    }
  }

  async getPdfByPath(filePath: string, userId?: number): Promise<Buffer> {
    try {
      // Validar y resolver la ruta de forma segura
      const safePath = this.validateAndResolveFilePath(filePath)

      // Verificar que el archivo existe
      try {
        await fs.access(safePath)
      } catch {
        throw new NotFoundException('Archivo PDF no encontrado')
      }

      // Si se proporciona userId, verificar permisos y generar PDF descifrado si es necesario
      if (userId) {
        const { document } = await this.getDocumentByPdfPath(safePath, userId)

        // Si el documento es CIFRADO, generar PDF descifrado
        if (document.category === 'CIFRADO') {
          return await this.generateDecryptedPdf(
            document.body,
            document.subject,
            document.authorId,
          )
        }
      }

      // Para documentos NORMAL o si no se proporciona userId, devolver el PDF original
      const fileBuffer = await fs.readFile(safePath)

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

  async deleteDocument(id: number): Promise<void> {
    const prisma = this.databaseService.getAdminClient()

    try {
      // Ensure document exists before attempting delete
      const existingDocument = await prisma.document.findUnique({
        where: { id },
      })

      if (!existingDocument) {
        throw new BadRequestException(`Documento con ID ${id} no encontrado`)
      }

      await prisma.document.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException(
        error instanceof Error
          ? `Error al eliminar el documento: ${error.message}`
          : 'Error al eliminar el documento',
      )
    }
  }

  async markDocumentAsRead(documentId: number, userId: number): Promise<void> {
    const prisma = this.databaseService.getAdminClient()

    try {
      const existingRecipient = await prisma.documentRecipient.findFirst({
        where: {
          documentId,
          recipientId: userId,
        },
      })

      if (!existingRecipient) {
        throw new BadRequestException(
          `No se encontró un destinatario para el documento ${documentId} y usuario ${userId}`,
        )
      }

      if (existingRecipient.isRead) {
        return
      }

      await prisma.documentRecipient.updateMany({
        where: {
          documentId,
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readDate: new Date(),
        },
      })
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException(
        error instanceof Error
          ? `Error al marcar el documento como leído: ${error.message}`
          : 'Error al marcar el documento como leído',
      )
    }
  }
}
