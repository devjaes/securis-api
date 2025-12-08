# API de Firma QR Automática

## Descripción

Esta funcionalidad permite generar automáticamente un código QR con información del remitente y embebirlo en el documento PDF. El QR se inserta en el lugar donde se coloque el placeholder `{{signature}}` en el HTML.

## Características

- ✅ Generación automática de QR con información del remitente
- ✅ Reemplazo automático del placeholder `{{signature}}` en el HTML
- ✅ QR embebido directamente en el PDF generado
- ✅ Funciona tanto en creación como en actualización de documentos

## Información contenida en el QR

El código QR contiene un JSON con la siguiente información:

```json
{
  "name": "Nombre del Remitente",
  "email": "remitente@uta.edu.ec",
  "id": 1,
  "timestamp": "2024-12-07T17:30:00.000Z"
}
```

## Uso en el Frontend

### 1. Crear Documento con Firma QR

#### Endpoint

```
POST /documents
```

#### Request Body (multipart/form-data)

```typescript
const formData = new FormData()

// Campos requeridos
formData.append('documentType', 'OFICIO') // o 'MEMORANDO'
formData.append('category', 'NORMAL') // o 'CIFRADO'
formData.append('subject', 'Asunto del documento')
formData.append(
  'html',
  `
  <h1>Mi Documento</h1>
  <p>Contenido del documento...</p>
  
  <!-- Coloca el placeholder donde quieras que aparezca el QR -->
  {{signature}}
  
  <p>Fin del documento</p>
`,
)
formData.append('authorId', '1')

// ⭐ NUEVO: Flag para incluir firma QR automática
formData.append('includeSignature', 'true')

// Campos opcionales
formData.append('status', 'BORRADOR')
formData.append('password', 'miContraseña123') // Requerido si category es NORMAL
formData.append('recipientEmails', 'destinatario1@uta.edu.ec')
formData.append('recipientEmails', 'destinatario2@uta.edu.ec')

// Archivos adjuntos (opcional)
if (attachments) {
  attachments.forEach((file) => {
    formData.append('attachments', file)
  })
}
```

#### Ejemplo con Fetch API

```typescript
async function createDocumentWithSignature() {
  const formData = new FormData()

  formData.append('documentType', 'OFICIO')
  formData.append('category', 'NORMAL')
  formData.append('subject', 'Documento con Firma Digital')
  formData.append(
    'html',
    `
    <div style="text-align: center;">
      <h1>Documento Oficial</h1>
      <p>Este documento contiene una firma digital verificable.</p>
      
      <div style="margin-top: 50px;">
        {{signature}}
      </div>
      
      <p style="margin-top: 20px;">Firmado digitalmente</p>
    </div>
  `,
  )
  formData.append('authorId', '1')
  formData.append('password', 'miContraseña123')
  formData.append('includeSignature', 'true') // ⭐ Activar firma QR

  const response = await fetch('/api/documents', {
    method: 'POST',
    body: formData,
    headers: {
      // No incluir Content-Type, el navegador lo hará automáticamente
      Authorization: `Bearer ${token}`,
    },
  })

  const result = await response.json()
  return result
}
```

#### Ejemplo con Axios

```typescript
import axios from 'axios'

async function createDocumentWithSignature() {
  const formData = new FormData()

  formData.append('documentType', 'OFICIO')
  formData.append('category', 'NORMAL')
  formData.append('subject', 'Documento con Firma Digital')
  formData.append(
    'html',
    `
    <h1>Mi Documento</h1>
    <p>Contenido...</p>
    {{signature}}
  `,
  )
  formData.append('authorId', '1')
  formData.append('password', 'miContraseña123')
  formData.append('includeSignature', 'true') // ⭐ Activar firma QR

  const response = await axios.post('/api/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  })

  return response.data
}
```

### 2. Actualizar Documento con Firma QR

#### Endpoint

```
PUT /documents/:id
```

#### Request Body (JSON)

```typescript
const updateData = {
  html: `
    <h1>Documento Actualizado</h1>
    <p>Nuevo contenido...</p>
    
    <!-- El placeholder se reemplazará con el QR -->
    {{signature}}
  `,
  includeSignature: true, // ⭐ Activar firma QR
  password: 'miContraseña123', // Requerido si category es NORMAL
  subject: 'Nuevo asunto',
}

const response = await fetch(`/api/documents/${documentId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(updateData),
})
```

## Comportamiento del Placeholder

### ✅ Funciona

- `{{signature}}` - Reemplazo estándar
- `{{ signature }}` - Con espacios (también funciona)
- `{{SIGNATURE}}` - Case-insensitive

### ❌ No funciona

- `{signature}` - Sin doble llave
- `{{signature}}` dentro de comentarios HTML `<!-- {{signature}} -->`
- Múltiples `{{signature}}` - Solo el primero será reemplazado (comportamiento actual)

## Estilo del QR en el PDF

El QR se inserta con el siguiente HTML:

```html
<div style="text-align: center; margin: 20px 0;">
  <img
    src="data:image/png;base64,..."
    alt="Firma Digital"
    style="max-width: 200px; height: auto;" />
  <p style="margin-top: 10px; font-size: 10pt; color: #666;">Firma Digital</p>
</div>
```

### Personalización

Si necesitas personalizar el estilo, puedes envolver el placeholder:

```html
<div style="border: 1px solid #ccc; padding: 20px; text-align: center;">
  <h3>Firma Digital del Remitente</h3>
  {{signature}}
  <p style="font-size: 9pt; color: #999;">
    Escanee el código QR para verificar la información del remitente
  </p>
</div>
```

## Respuesta del API

### Crear Documento (201 Created)

```json
{
  "success": true,
  "message": "Documento creado exitosamente",
  "data": {
    "document": {
      "id": 1,
      "documentType": "OFICIO",
      "category": "NORMAL",
      "status": "BORRADOR",
      "subject": "Documento con Firma Digital",
      "body": "<h1>Documento...</h1><div>...QR embebido...</div>",
      "pdfPath": "uploads/documents/pdf-documento-1234567890-abc123.pdf",
      "author": {
        "id": 1,
        "name": "Juan Pérez",
        "email": "juan.perez@uta.edu.ec"
      },
      "attachments": [],
      "recipients": []
    },
    "attachments": [],
    "recipients": []
  }
}
```

## Validaciones

### ⚠️ Importante

1. **Autor debe existir**: Si `includeSignature: true`, el `authorId` debe corresponder a un usuario válido en la base de datos.

2. **HTML requerido**: El campo `html` es obligatorio cuando se usa `includeSignature`.

3. **Placeholder opcional**: Si no incluyes `{{signature}}` en el HTML pero activas `includeSignature`, el QR se generará pero no se insertará en ningún lugar.

## Ejemplos de Uso

### Ejemplo 1: Documento Simple con Firma al Final

```html
<form id="documentForm">
  <textarea name="html">
    <h1>Oficio N° 001</h1>
    <p>Por medio del presente, me dirijo a usted para...</p>
    <p>Atentamente,</p>
    <div style="margin-top: 50px;">
      {{signature}}
    </div>
  </textarea>
  <input type="hidden" name="includeSignature" value="true" />
  <!-- otros campos -->
</form>
```

### Ejemplo 2: Documento con Firma en Encabezado

```html
<div
  style="display: flex; justify-content: space-between; align-items: center;">
  <div>
    <h2>Universidad Técnica de Ambato</h2>
    <p>Departamento de Informática</p>
  </div>
  <div>{{signature}}</div>
</div>
<h1>Documento Oficial</h1>
<p>Contenido...</p>
```

### Ejemplo 3: React Component

```tsx
import React, { useState } from 'react'
import axios from 'axios'

function DocumentForm() {
  const [html, setHtml] = useState('')
  const [includeSignature, setIncludeSignature] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('documentType', 'OFICIO')
    formData.append('category', 'NORMAL')
    formData.append('subject', 'Mi Documento')
    formData.append('html', html)
    formData.append('authorId', '1')
    formData.append('password', 'miContraseña123')
    formData.append('includeSignature', includeSignature.toString())

    try {
      const response = await axios.post('/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      })
      console.log('Documento creado:', response.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        placeholder="Ingresa el HTML del documento. Usa {{signature}} para la firma QR"
        rows={10}
      />

      <label>
        <input
          type="checkbox"
          checked={includeSignature}
          onChange={(e) => setIncludeSignature(e.target.checked)}
        />
        Incluir firma QR automática
      </label>

      <button type="submit">Crear Documento</button>
    </form>
  )
}
```

## Verificación del QR

Para verificar el contenido del QR generado:

1. Descarga el PDF del documento
2. Abre el PDF y localiza el código QR
3. Escanea el QR con cualquier lector de códigos QR
4. Verás un JSON con la información del remitente

### Ejemplo de contenido del QR

```json
{
  "name": "Juan Pérez",
  "email": "juan.perez@uta.edu.ec",
  "id": 1,
  "timestamp": "2024-12-07T17:30:00.000Z"
}
```

## Troubleshooting

### El QR no aparece en el PDF

1. ✅ Verifica que `includeSignature: true` esté en el request
2. ✅ Verifica que `{{signature}}` esté en el HTML
3. ✅ Verifica que el `authorId` corresponda a un usuario válido
4. ✅ Revisa los logs del servidor para errores

### Error: "No se encontró el autor con ID X"

- El `authorId` proporcionado no existe en la base de datos
- Verifica que el usuario esté autenticado y que el ID sea correcto

### El placeholder no se reemplaza

- Verifica que uses exactamente `{{signature}}` (con doble llave)
- El reemplazo es case-insensitive, pero debe tener las llaves correctas
- Asegúrate de que el HTML no esté siendo escapado antes de enviarlo

## Notas Adicionales

- El QR se genera con un tamaño de 200x200 píxeles
- El QR usa corrección de errores nivel M (Medium)
- El QR contiene un timestamp de cuando se generó
- La imagen del QR se embebe como base64 directamente en el HTML

## Changelog

- **2024-12-07**: Implementación inicial de firma QR automática
  - Agregado campo `includeSignature` en CreateDocumentDto
  - Agregado campo `includeSignature` en UpdateDocumentDto
  - Implementado reemplazo automático de `{{signature}}`
  - Generación automática de QR con información del remitente
