# Huffman Encryption Feature

Sistema de cifrado multi-capa utilizando el algoritmo de Huffman implementado manualmente. Provee tres motores de cifrado independientes para Backend, Frontend y Base de Datos.

## 📋 Características

- ✅ Implementación completa del algoritmo de Huffman desde cero (sin librerías externas)
- ✅ Soporte completo para UTF-8 (incluye caracteres especiales del español: ñ, á, é, í, ó, ú, ¿, ¡)
- ✅ Compresión a Base64 para almacenamiento compacto
- ✅ Tres árboles independientes para las 3 capas de seguridad
- ✅ Arquitectura limpia (independiente del framework)
- ✅ Tests unitarios completos
- ✅ CLI para generación de árboles

## 🏗️ Arquitectura

```
src/features/encryption/
├── domain/                    # Capa de dominio (framework-agnostic)
│   ├── entities/             # HuffmanNode
│   ├── interfaces/           # Contratos de encoder/decoder/tree
│   └── value-objects/        # FrequencyMap
├── application/              # Capa de aplicación
│   ├── use-cases/           # Casos de uso (encode, decode, generate)
│   └── services/            # Servicios NestJS (HuffmanBackService, HuffmanDbService)
├── infrastructure/          # Capa de infraestructura
│   ├── adapters/           # Implementaciones de encoder/decoder
│   ├── generators/         # Generador de árboles Huffman
│   └── serializers/        # Serializadores (Binary↔Base64, Tree↔JSON)
├── presentation/           # Capa de presentación
│   ├── cli/               # CLI para generar árboles
│   └── encryption.module.ts
└── trees/                 # Árboles Huffman generados (JSON)
    ├── huffman-back.tree.json
    ├── huffman-front.tree.json
    └── huffman-db.tree.json
```

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
pnpm install tsx
```

### 2. Generar los árboles Huffman

```bash
pnpm huffman:generate
```

Esto creará tres archivos JSON en `src/features/encryption/trees/`:
- `huffman-back.tree.json` - Para el backend
- `huffman-front.tree.json` - Para el frontend (copiar a Vue.js)
- `huffman-db.tree.json` - Para la base de datos

### 3. Configurar variables de entorno

Actualizar `.env`:

```env
HUFFMAN_TREE_BACK_PATH=src/features/encryption/trees/huffman-back.tree.json
HUFFMAN_TREE_DB_PATH=src/features/encryption/trees/huffman-db.tree.json
```

### 4. Importar el módulo

En `app.module.ts`:

```typescript
import { EncryptionModule } from './features/encryption';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EncryptionModule,
    // ... otros módulos
  ],
})
export class AppModule {}
```

## 📖 Uso

### Cifrado para Backend (Huffman_Back)

```typescript
import { Injectable } from '@nestjs/common';
import { HuffmanBackService } from '@/features/encryption';

@Injectable()
export class DocumentService {
  constructor(private readonly huffmanBack: HuffmanBackService) {}

  async createDocument(content: string) {
    // Cifrar antes de enviar a la base de datos
    const encryptedContent = await this.huffmanBack.encode(content);
    
    // Guardar en BD...
    return { content: encryptedContent };
  }

  async getDocument(encryptedContent: string) {
    // Descifrar al leer de la base de datos
    const content = await this.huffmanBack.decode(encryptedContent);
    return { content };
  }
}
```

### Cifrado para Base de Datos (Huffman_DB)

```typescript
import { Injectable } from '@nestjs/common';
import { HuffmanDbService } from '@/features/encryption';

@Injectable()
export class UserRepository {
  constructor(private readonly huffmanDb: HuffmanDbService) {}

  async saveUser(email: string, name: string) {
    // Cifrar columnas sensibles antes de guardar
    const encrypted = await this.huffmanDb.encodeMultiple({
      email,
      name,
    });

    // Guardar en BD: { email: "SGVs...", name: "QmFz..." }
    await this.db.insert(users).values(encrypted);
  }

  async getUser(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Descifrar al leer
    const decrypted = await this.huffmanDb.decodeMultiple({
      email: user.email,
      name: user.name,
    });

    return decrypted;
  }
}
```

### Validaciones

```typescript
// Verificar si un texto puede ser cifrado
const canEncode = this.huffmanBack.canEncode('Hola Mundo');

// Verificar si un texto cifrado puede ser descifrado
const canDecode = this.huffmanBack.canDecode('SGVsbG8gV29ybGQ=');

// Obtener estadísticas de compresión
const stats = await this.huffmanBack.getCompressionStats('Hola Mundo');
console.log(stats);
// {
//   originalLength: 10,
//   encodedLength: 16,
//   compressionRatio: 0.5625,
//   spaceSavings: 43.75
// }
```

## 🧪 Tests

Ejecutar tests unitarios:

```bash
pnpm test
```

Ejecutar tests con cobertura:

```bash
pnpm test:cov
```

Ejecutar tests en modo watch:

```bash
pnpm test:watch
```

## 📝 Notas Importantes

### Soporte de Caracteres

El sistema soporta todos los caracteres UTF-8, incluyendo:
- Letras con acentos: á, é, í, ó, ú, Á, É, Í, Ó, Ú
- Caracteres especiales del español: ñ, Ñ, ü, Ü, ¿, ¡
- Números: 0-9
- Símbolos: @, #, $, %, &, *, +, =, etc.
- Saltos de línea, tabs, espacios

### Árboles Diferentes

Los tres árboles generados tienen:
- ✅ El **mismo conjunto de caracteres** (compatible con el mismo texto)
- ✅ **Estructuras diferentes** (generados con randomización del 15%)
- ✅ **Codificaciones diferentes** para el mismo texto

Esto significa que el mismo texto "Hola" producirá tres encodings distintos:
- Backend: `SGVs...`
- Database: `QmFz...`
- Frontend: `eHl6...`

### Migraci ón a Frontend

Todo el código en las carpetas `domain/` e `infrastructure/` es **framework-agnostic** y puede copiarse directamente a Vue.js/React:

1. Copiar `domain/` y `infrastructure/`  al frontend
2. Copiar `huffman-front.tree.json`
3. Adaptar el `TreeFileLoaderAdapter` para usar `fetch` en lugar de `fs`
4. Crear un servicio similar a `HuffmanBackService` pero para frontend

## 🔒 Seguridad

- **NO** almacenar los árboles JSON en el repositorio público
- **NO** exponer los árboles a través de APIs
- **SÍ** usar variables de entorno para las rutas
- **SÍ** asegurar que los archivos `.tree.json` estén en `.gitignore`

## 📚 Documentación Adicional

Para más información sobre el algoritmo de Huffman:
- [Huffman Coding - GeeksforGeeks](https://www.geeksforgeeks.org/huffman-coding-greedy-algo-3/)
- [Huffman Coding - Wikipedia](https://en.wikipedia.org/wiki/Huffman_coding)

---

**Última actualización:** 2025-01-19  
**Versión:** 1.0.0  
**Autor:** Jair Andrés Espinoza Salazar
