# Actualización: Cifrado de Respuestas API

## 🔄 Cambio Implementado

**Todas las respuestas del API ahora tienen el campo `data` cifrado con Huffman.**

El backend ahora cifra automáticamente todo el contenido de `data` antes de enviarlo. El frontend debe descifrarlo.

## 📋 Formato de Respuesta

**Antes:**
```json
{
  "success": true,
  "message": {...},
  "data": {
    "documents": [...],
    "total": 14
  }
}
```

**Ahora:**
```json
{
  "success": true,
  "message": {...},
  "data": "SGVsbG8gV29ybGQh..." // ← Cifrado con Huffman
}
```

## 🔧 Actualización del Interceptor de Axios

Actualiza tu interceptor de respuesta para descifrar `data`:

```typescript
import axios from 'axios'
import { HuffmanFrontService } from '@/services/huffman-front.service'

// Crear instancia del servicio (o inyectarlo según tu setup)
const huffmanFront = new HuffmanFrontService()

axios.interceptors.response.use(
  async (response) => {
    // Si la respuesta tiene data y es un string (cifrado)
    if (response.data?.data && typeof response.data.data === 'string') {
      try {
        // Descifrar el contenido
        const decryptedJson = huffmanFront.decode(response.data.data)
        const decryptedData = JSON.parse(decryptedJson)
        
        // Reemplazar data cifrado con data descifrado
        response.data.data = decryptedData
      } catch (error) {
        console.error('Error descifrando respuesta:', error)
        // Manejar error según tu lógica
      }
    }
    
    return response
  },
  (error) => {
    // Manejo de errores
    return Promise.reject(error)
  }
)
```

## ✅ Endpoints Excluidos

Estos endpoints **NO** envían `data` cifrado (puedes omitir el descifrado):
- `/health`
- `/api/docs`
- `/pdf/download`
- `/encryption/test-message`

## 📝 Ejemplo Completo

```typescript
// axios.interceptor.ts
import axios from 'axios'
import { HuffmanFrontService } from '@/services/huffman-front.service'

const huffmanFront = new HuffmanFrontService()

// Interceptor de respuesta
axios.interceptors.response.use(
  (response) => {
    const url = response.config.url || ''
    
    // Skip descifrado para endpoints excluidos
    const excludedPaths = ['/health', '/api/docs', '/pdf/download', '/encryption/test-message']
    if (excludedPaths.some(path => url.includes(path))) {
      return response
    }
    
    // Descifrar data si existe y es string
    if (response.data?.data && typeof response.data.data === 'string') {
      try {
        const decrypted = huffmanFront.decode(response.data.data)
        response.data.data = JSON.parse(decrypted)
      } catch (error) {
        console.error('Error descifrando respuesta:', error)
      }
    }
    
    return response
  },
  (error) => Promise.reject(error)
)
```

## ⚠️ Importante

- **Siempre** verifica que `data` sea un string antes de intentar descifrarlo
- Maneja errores de descifrado apropiadamente
- El campo `message` y `success` **NO** están cifrados, solo `data`

---
**Fecha de implementación:** 2024-12-07

