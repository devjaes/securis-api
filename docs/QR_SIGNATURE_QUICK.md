# Firma QR Automática - Guía Rápida

## 🚀 Uso Básico

### 1. Agregar el placeholder en el HTML

```html
<p>Contenido del documento...</p>
{{signature}}
<p>Fin del documento</p>
```

### 2. Activar la firma en el request

```typescript
formData.append('includeSignature', 'true')
```

## 📝 Ejemplo Completo

```typescript
// Crear documento con firma QR
const formData = new FormData()
formData.append('documentType', 'OFICIO')
formData.append('category', 'NORMAL')
formData.append('subject', 'Mi Documento')
formData.append(
  'html',
  `
  <h1>Documento</h1>
  <p>Contenido...</p>
  {{signature}}
`,
)
formData.append('authorId', '1')
formData.append('password', 'miContraseña123')
formData.append('includeSignature', 'true') // ⭐ Activar firma

const response = await fetch('/api/documents', {
  method: 'POST',
  body: formData,
  headers: { Authorization: `Bearer ${token}` },
})
```

## ✅ Checklist

- [ ] Incluir `{{signature}}` en el HTML donde quieras el QR
- [ ] Agregar `includeSignature: true` en el request
- [ ] Asegurarse de que el `authorId` sea válido
- [ ] Si `category: 'NORMAL'`, incluir `password`

## 📦 Información del QR

El QR contiene:

```json
{
  "name": "Nombre del Remitente",
  "email": "email@uta.edu.ec",
  "id": 1,
  "timestamp": "2024-12-07T17:30:00.000Z"
}
```

## 🔍 Endpoints

- **Crear**: `POST /documents` con `includeSignature: true`
- **Actualizar**: `PUT /documents/:id` con `includeSignature: true`

## ⚠️ Notas

- El placeholder `{{signature}}` es case-insensitive
- Funciona con espacios: `{{ signature }}`
- El QR se genera automáticamente con información del autor
- Se embebe directamente en el PDF como imagen base64

---

📖 Para más detalles, ver [QR_SIGNATURE_API.md](./QR_SIGNATURE_API.md)
