// backend/src/modules/pdf/pdf.service.ts

import { Injectable } from '@nestjs/common'
import * as fs from 'fs/promises'
import * as path from 'path'
import puppeteer from 'puppeteer'
import { encryptPDF } from 'pdf-password'

@Injectable()
export class PdfService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'documents')
  private readonly attachmentsDir = path.join(
    process.cwd(),
    'uploads',
    'documents',
    'attachments',
  )

  constructor() {
    // Crear directorios de uploads si no existen
    void this.ensureUploadDir()
    void this.ensureAttachmentsDir()
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true })
    } catch (error) {
      console.error('Error creating upload directory:', error)
    }
  }

  private async ensureAttachmentsDir() {
    try {
      await fs.mkdir(this.attachmentsDir, { recursive: true })
    } catch (error) {
      console.error('Error creating attachments directory:', error)
    }
  }

  generateFilename(originalName: string, prefix: string = ''): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const extension = path.extname(originalName)
    const basename = path.basename(originalName, extension)

    return `${prefix}${basename}-${timestamp}-${random}${extension}`
  }

  /**
   * Genera un PDF a partir de HTML proporcionado
   * @param html - Contenido HTML a convertir a PDF
   * @param options - Opciones adicionales (título, nombre de archivo, etc.)
   * @returns Ruta del archivo PDF generado
   */
  async generatePdf(
    html: string,
    options?: {
      title?: string
      filename?: string
      author?: string
      subject?: string
    },
  ): Promise<string> {
    await this.ensureUploadDir()

    const filename =
      options?.filename || this.generateFilename('documento.pdf', 'pdf-')
    const filePath = path.join(this.uploadDir, filename)

    let browser
    try {
      // Lanzar el navegador
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      })

      const page = await browser.newPage()

      // Configurar el contenido HTML con estilos básicos si no los tiene
      const htmlContent = this.wrapHtmlContent(html, options)

      // Establecer el contenido HTML
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      })

      // Generar el PDF
      await page.pdf({
        path: filePath,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(options?.title),
        footerTemplate: this.getFooterTemplate(),
      })

      await browser.close()

      return filePath
    } catch (error) {
      if (browser) {
        await browser.close().catch(() => {
          // Ignorar errores al cerrar el navegador
        })
      }
      throw new Error(
        error instanceof Error
          ? `Error al generar el PDF: ${error.message}`
          : 'Error al generar el PDF',
      )
    }
  }

  /**
   * Envuelve el contenido HTML con estructura básica si no la tiene
   */
  private wrapHtmlContent(
    html: string,
    options?: {
      title?: string
      author?: string
      subject?: string
    },
  ): string {
    // Si el HTML ya tiene estructura completa (html, head, body), usarlo tal cual
    if (html.includes('<html') && html.includes('<body')) {
      return html
    }

    // Si no, envolverlo con estructura básica
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options?.title || 'Documento'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-weight: bold;
    }
    p {
      margin-bottom: 1em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    table th, table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `.trim()
  }

  /**
   * Genera el template del encabezado para el PDF
   */
  private getHeaderTemplate(title?: string): string {
    return `
      <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px 0; border-bottom: 1px solid #ddd;">
        <span>${title || 'Documento'}</span>
      </div>
    `
  }

  /**
   * Genera el template del pie de página para el PDF
   */
  private getFooterTemplate(): string {
    return `
      <div style="font-size: 8px; text-align: center; width: 100%; padding: 10px 0; border-top: 1px solid #ddd;">
        <span style="float: left;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        <span style="float: right;"><span class="date"></span></span>
      </div>
    `
  }

  /**
   * Genera un PDF protegido con contraseña a partir de HTML
   * @param html - Contenido HTML a convertir a PDF
   * @param password - Contraseña para proteger el PDF
   * @param options - Opciones adicionales (título, nombre de archivo, etc.)
   * @returns Ruta del archivo PDF generado
   */
  async generatePdfWithPassword(
    html: string,
    password: string,
    options?: {
      title?: string
      filename?: string
      author?: string
      subject?: string
    },
  ): Promise<string> {
    await this.ensureUploadDir()

    // Generar nombre de archivo final (usar el proporcionado o generar uno único)
    const finalFilename =
      options?.filename ||
      this.generateFilename('documento-protegido.pdf', 'pdf-protected-')
    const finalFilePath = path.join(this.uploadDir, finalFilename)

    // Generar nombre de archivo temporal único (siempre diferente al final)
    const tempFilename = this.generateFilename(
      'temp-documento.pdf',
      'pdf-temp-',
    )
    const tempFilePath = path.join(this.uploadDir, tempFilename)

    // Generar PDF temporal sin contraseña
    await this.generatePdf(html, {
      title: options?.title,
      author: options?.author,
      subject: options?.subject,
      filename: tempFilename,
    })

    // Verificar que el archivo temporal se creó correctamente
    try {
      await fs.access(tempFilePath)
    } catch {
      throw new Error(
        `Error: No se pudo crear el archivo temporal en ${tempFilePath}`,
      )
    }

    // Proteger el PDF con contraseña usando pdf-password
    try {
      await encryptPDF({
        inFile: tempFilePath,
        outFile: finalFilePath,
        password,
      })

      // Verificar que el archivo protegido se creó correctamente
      try {
        await fs.access(finalFilePath)
      } catch {
        throw new Error(
          `Error: No se pudo crear el archivo protegido en ${finalFilePath}`,
        )
      }

      // Eliminar el archivo temporal
      await fs.unlink(tempFilePath).catch(() => {
        // Ignorar errores al eliminar el archivo temporal
      })

      return finalFilePath
    } catch (error) {
      // Intentar eliminar el archivo temporal incluso si hay error
      await fs.unlink(tempFilePath).catch(() => {
        // Ignorar errores al eliminar el archivo temporal
      })

      // Si el archivo final existe pero hubo un error, intentar eliminarlo también
      await fs.unlink(finalFilePath).catch(() => {
        // Ignorar errores
      })

      throw error instanceof Error
        ? error
        : new Error('Error al proteger el PDF con contraseña')
    }
  }

  /**
   * Guarda un archivo PDF adjunto
   * @param fileBuffer - Buffer del archivo PDF
   * @param originalName - Nombre original del archivo
   * @returns Ruta del archivo guardado
   */
  async saveAttachment(
    fileBuffer: Buffer,
    originalName: string,
  ): Promise<string> {
    await this.ensureAttachmentsDir()

    // Validar que sea un PDF
    if (!originalName.toLowerCase().endsWith('.pdf')) {
      throw new Error('El archivo adjunto debe ser un PDF')
    }

    const filename = this.generateFilename(originalName, 'attachment-')
    const filePath = path.join(this.attachmentsDir, filename)

    await fs.writeFile(filePath, fileBuffer)

    return filePath
  }
}
