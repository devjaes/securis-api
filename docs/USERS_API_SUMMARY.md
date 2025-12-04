# 📋 Resumen Ejecutivo - API de Gestión de Usuarios

## 🎯 Endpoints Disponibles

| Método | Endpoint              | Autenticación | Encriptación | Descripción                    |
| ------ | --------------------- | ------------- | ------------ | ------------------------------ |
| `POST` | `/api/users`          | ❌ No         | ✅ Sí        | Crear nuevo usuario            |
| `GET`  | `/api/users`          | ❌ No         | ❌ No        | Listar todos los usuarios      |
| `GET`  | `/api/users/:id`      | ❌ No         | ❌ No        | Obtener usuario por ID         |
| `PATCH` | `/api/users/:id`      | ❌ No         | ✅ Sí        | Actualizar usuario             |
| `DELETE` | `/api/users/:id`     | ❌ No         | ❌ No        | Eliminar usuario               |

⚠️ **Nota:** Los endpoints actualmente NO tienen protección de autenticación. En producción, deberían estar protegidos con JWT y roles de administrador.

---

## 📥 Request/Response

### 1. Crear Usuario

```http
POST /api/users
Content-Type: application/json

{
  "payload": "{huffman_encoded_data}"
}
```

**Body (desencriptado):**

```json
{
  "email": "usuario@uta.edu.ec",
  "name": "Nombre Usuario"
}
```

**Response - Éxito (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@uta.edu.ec",
  "name": "Nombre Usuario",
  "microsoftId": null,
  "qrSignature": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Response - Error (409):**

```json
{
  "statusCode": 409,
  "message": "El email ya está registrado"
}
```

---

### 2. Listar Usuarios

```http
GET /api/users
```

**Response - Éxito (200):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario1@uta.edu.ec",
    "name": "Usuario Uno",
    "microsoftId": "abc123",
    "qrSignature": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### 3. Obtener Usuario por ID

```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000
```

**Response - Éxito (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@uta.edu.ec",
  "name": "Nombre Usuario",
  "microsoftId": "abc123",
  "qrSignature": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Response - Error (404):**

```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado"
}
```

---

### 4. Actualizar Usuario

```http
PATCH /api/users/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "payload": "{huffman_encoded_data}"
}
```

**Body (desencriptado):**

```json
{
  "name": "Nuevo Nombre",
  "email": "nuevo@uta.edu.ec",
  "password": "nueva_contraseña"
}
```

**Nota:** Todos los campos son opcionales. Solo envía los que quieres actualizar.

**Response - Éxito (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "nuevo@uta.edu.ec",
  "name": "Nuevo Nombre",
  "microsoftId": "abc123",
  "qrSignature": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Response - Error (409):**

```json
{
  "statusCode": 409,
  "message": "El email ya está registrado"
}
```

---

### 5. Eliminar Usuario

```http
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000
```

**Response - Éxito (204):**

Sin contenido en el body.

**Response - Error (404):**

```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado"
}
```

---

## 💻 Código Frontend Mínimo

### Crear Usuario

```javascript
import { huffmanEncode } from '@/utils/encryption';

const userData = {
  email: 'usuario@uta.edu.ec',
  name: 'Nombre Usuario',
};

const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payload: huffmanEncode(JSON.stringify(userData)),
  }),
});

const data = await response.json();
```

### Listar Usuarios

```javascript
const response = await fetch('http://localhost:3000/api/users');
const users = await response.json();
```

### Obtener Usuario

```javascript
const userId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`http://localhost:3000/api/users/${userId}`);
const user = await response.json();
```

### Actualizar Usuario

```javascript
import { huffmanEncode } from '@/utils/encryption';

const userId = '550e8400-e29b-41d4-a716-446655440000';
const updateData = {
  name: 'Nuevo Nombre',
  email: 'nuevo@uta.edu.ec',
};

const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payload: huffmanEncode(JSON.stringify(updateData)),
  }),
});

const updatedUser = await response.json();
```

### Eliminar Usuario

```javascript
const userId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
  method: 'DELETE',
});

if (response.status === 204) {
  console.log('Usuario eliminado');
}
```

---

## ⚠️ Errores Comunes

| Error                          | Causa                              | Solución                                    |
| ------------------------------ | ---------------------------------- | ------------------------------------------- |
| `El email ya está registrado` | Email duplicado                   | Usar otro email o actualizar usuario existente |
| `Usuario no encontrado`        | ID inválido o usuario eliminado   | Verificar ID o crear nuevo usuario          |
| `El email debe ser válido`     | Formato de email incorrecto        | Verificar formato del email                 |
| `El nombre es requerido`       | Campo name vacío                  | Proporcionar nombre                         |
| `La contraseña debe tener al menos 6 caracteres` | Contraseña muy corta | Usar contraseña de al menos 6 caracteres     |

---

## 📝 Validaciones

### Crear Usuario
- ✅ `email`: Requerido, formato válido, único
- ✅ `name`: Requerido, string

### Actualizar Usuario
- ✅ `email`: Opcional, formato válido, único (si se proporciona)
- ✅ `name`: Opcional, string
- ✅ `password`: Opcional, mínimo 6 caracteres

---

## 🔐 Seguridad

### ⚠️ Estado Actual

Los endpoints **NO tienen protección de autenticación**. Esto significa que:
- ❌ Cualquiera puede crear usuarios
- ❌ Cualquiera puede ver todos los usuarios
- ❌ Cualquiera puede actualizar usuarios
- ❌ Cualquiera puede eliminar usuarios

### ✅ Recomendaciones para Producción

1. **Agregar autenticación JWT:**
   ```typescript
   @UseGuards(AuthGuard('jwt'))
   ```

2. **Agregar roles de administrador:**
   ```typescript
   @Roles('admin')
   ```

3. **Validar permisos:**
   - Solo administradores pueden crear/editar/eliminar usuarios
   - Usuarios normales solo pueden ver su propio perfil

### 🔒 Encriptación

Los endpoints `POST` y `PATCH` están sujetos a encriptación Huffman:
- ✅ El body debe enviarse encriptado
- ✅ Formato: `{ payload: huffmanEncode(JSON.stringify(data)) }`

---

## ✅ Checklist Frontend

- [ ] Servicio de usuarios (`UsersService`)
- [ ] Tipos TypeScript (`User`, `CreateUserDto`, `UpdateUserDto`)
- [ ] Componente de lista de usuarios
- [ ] Formulario de crear usuario
- [ ] Formulario de editar usuario
- [ ] Funcionalidad de eliminar con confirmación
- [ ] Manejo de errores (409, 404, 400)
- [ ] Encriptación Huffman para POST y PATCH
- [ ] Validaciones en frontend
- [ ] Loading states
- [ ] Mensajes de éxito/error
- [ ] Paginación (opcional)
- [ ] Búsqueda/filtrado (opcional)

---

## 🔗 URLs Base

- **API:** `http://localhost:3000/api`
- **Crear:** `POST http://localhost:3000/api/users`
- **Listar:** `GET http://localhost:3000/api/users`
- **Obtener:** `GET http://localhost:3000/api/users/:id`
- **Actualizar:** `PATCH http://localhost:3000/api/users/:id`
- **Eliminar:** `DELETE http://localhost:3000/api/users/:id`

---

## 🎯 Flujo Típico

```
1. Admin crea usuario → POST /users { email, name }
   ↓
2. Usuario recibe email/notificación
   ↓
3. Usuario establece contraseña → POST /auth/set-password { email, isFirstTime: true }
   ↓
4. Usuario puede hacer login → POST /auth/login
   ↓
5. Admin puede actualizar/eliminar → PATCH/DELETE /users/:id
```

---

Para más detalles, ver [USERS_API.md](./USERS_API.md)


