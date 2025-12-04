# 👥 API de Gestión de Usuarios - Documentación Frontend

## 📋 Información General

**Base URL:** `http://localhost:3000/api` (o la URL de tu backend en producción)

Esta API permite realizar operaciones CRUD (Create, Read, Update, Delete) sobre los usuarios del sistema. **Los endpoints `POST` y `PATCH` están sujetos a encriptación**, por lo que el body debe enviarse usando el sistema de encriptación Huffman.

---

## 🚀 Endpoints Disponibles

### 1. Crear Usuario

**Endpoint:** `POST /users`

**Descripción:** Crea un nuevo usuario en el sistema. Solo requiere `email` y `name`. La contraseña se establece después usando el endpoint de establecer contraseña.

**Request:**

```http
POST /api/users
Content-Type: application/json

{
  "email": "usuario@uta.edu.ec",
  "name": "Nombre Usuario"
}
```

**Body Parameters:**

- `email` (string, requerido): Email del usuario (debe ser válido y único)
- `name` (string, requerido): Nombre completo del usuario

**Response - Éxito (201 Created):**

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

**Response - Error (409 Conflict):**

```json
{
  "statusCode": 409,
  "message": "El email ya está registrado"
}
```

**Response - Error (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": ["El email debe ser válido", "El nombre es requerido"]
}
```

---

### 2. Listar Todos los Usuarios

**Endpoint:** `GET /users`

**Descripción:** Obtiene una lista de todos los usuarios registrados en el sistema.

**Request:**

```http
GET /api/users
```

**Response - Éxito (200 OK):**

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
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "usuario2@uta.edu.ec",
    "name": "Usuario Dos",
    "microsoftId": null,
    "qrSignature": null,
    "createdAt": "2024-01-16T11:00:00.000Z",
    "updatedAt": "2024-01-16T11:00:00.000Z"
  }
]
```

---

### 3. Obtener Usuario por ID

**Endpoint:** `GET /users/:id`

**Descripción:** Obtiene la información de un usuario específico por su ID.

**Request:**

```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000
```

**URL Parameters:**

- `id` (string, requerido): UUID del usuario

**Response - Éxito (200 OK):**

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

**Response - Error (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado"
}
```

---

### 4. Actualizar Usuario

**Endpoint:** `PATCH /users/:id`

**Descripción:** Actualiza la información de un usuario existente. Todos los campos son opcionales.

**Request:**

```http
PATCH /api/users/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "name": "Nuevo Nombre",
  "email": "nuevo@uta.edu.ec"
}
```

**URL Parameters:**

- `id` (string, requerido): UUID del usuario

**Body Parameters (todos opcionales):**

- `email` (string, opcional): Nuevo email (debe ser válido y único)
- `name` (string, opcional): Nuevo nombre
- `password` (string, opcional): Nueva contraseña (mínimo 6 caracteres)

**Response - Éxito (200 OK):**

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

**Response - Error (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado"
}
```

**Response - Error (409 Conflict):**

```json
{
  "statusCode": 409,
  "message": "El email ya está registrado"
}
```

---

### 5. Eliminar Usuario

**Endpoint:** `DELETE /users/:id`

**Descripción:** Elimina un usuario del sistema.

**Request:**

```http
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000
```

**URL Parameters:**

- `id` (string, requerido): UUID del usuario

**Response - Éxito (204 No Content):**

Sin contenido en el body.

**Response - Error (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado"
}
```

---

## ⚠️ Manejo de Errores

### Error: Email ya registrado (409 Conflict)

**Cuándo ocurre:**

- Intentas crear un usuario con un email que ya existe
- Intentas actualizar un usuario con un email que ya está en uso por otro usuario

**Response:**

```json
{
  "statusCode": 409,
  "message": "El email ya está registrado"
}
```

**Acción del Frontend:**

```typescript
try {
  await UsersService.create({ email, name });
} catch (error) {
  if (error.message.includes('email ya está registrado')) {
    // Mostrar mensaje específico
    setError('Este email ya está registrado. Por favor, usa otro email.');
  } else {
    setError('Error al crear usuario');
  }
}
```

### Error: Usuario no encontrado (404 Not Found)

**Cuándo ocurre:**

- Intentas obtener, actualizar o eliminar un usuario que no existe

**Response:**

```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado"
}
```

**Acción del Frontend:**

```typescript
try {
  await UsersService.findOne(userId);
} catch (error) {
  if (error.message === 'Usuario no encontrado') {
    // Redirigir o mostrar mensaje
    navigate('/users');
    alert('El usuario no existe');
  }
}
```

### Error: Validación (400 Bad Request)

**Cuándo ocurre:**

- Los datos enviados no cumplen con las validaciones (email inválido, campos requeridos faltantes, etc.)

**Response:**

```json
{
  "statusCode": 400,
  "message": ["El email debe ser válido", "El nombre es requerido"]
}
```

**Acción del Frontend:**

```typescript
try {
  await UsersService.create({ email, name });
} catch (error) {
  if (Array.isArray(error.message)) {
    // Mostrar todos los errores de validación
    setErrors(error.message);
  }
}
```

---

## 📝 Validaciones

### Email

- **Formato:** Debe ser un email válido
- **Unicidad:** Debe ser único en el sistema
- **Requerido:** Sí (en creación)

### Nombre

- **Tipo:** String
- **Requerido:** Sí (en creación)
- **Opcional:** En actualización

### Contraseña (en actualización)

- **Mínimo:** 6 caracteres
- **Tipo:** String
- **Opcional:** Sí

---

## 🔐 Seguridad

### ⚠️ Nota Importante

**Los endpoints de usuarios actualmente NO tienen protección de autenticación.** Esto significa que:

- ✅ Cualquiera puede crear usuarios
- ✅ Cualquiera puede ver todos los usuarios
- ✅ Cualquiera puede actualizar usuarios
- ✅ Cualquiera puede eliminar usuarios

**Recomendación:** En producción, estos endpoints deberían estar protegidos con:

- Autenticación JWT (`@UseGuards(AuthGuard('jwt'))`)
- Roles de administrador (`@Roles('admin')`)

### Encriptación

Los endpoints `POST` y `PATCH` están sujetos a encriptación Huffman. Asegúrate de:

- Encriptar el body antes de enviarlo
- Usar el formato `{ payload: huffmanEncode(JSON.stringify(data)) }`

---

## ✅ Checklist de Implementación

- [ ] Crear servicio de usuarios (`UsersService`)
- [ ] Crear tipos TypeScript para `User`, `CreateUserDto`, `UpdateUserDto`
- [ ] Implementar componente de lista de usuarios
- [ ] Implementar formulario de crear usuario
- [ ] Implementar formulario de editar usuario
- [ ] Implementar funcionalidad de eliminar usuario con confirmación
- [ ] Manejar errores (409, 404, 400)
- [ ] Implementar encriptación Huffman para POST y PATCH
- [ ] Agregar validaciones en el frontend
- [ ] Agregar loading states
- [ ] Agregar mensajes de éxito/error
- [ ] Implementar paginación (si es necesario)
- [ ] Implementar búsqueda/filtrado (si es necesario)

---

## 🎯 Flujo Visual

```
Panel de Administración
        ↓
Lista de Usuarios (GET /users)
        ↓
    ┌────┴────┐
    ↓         ↓
Crear      Editar/Eliminar
Usuario    Usuario
    ↓         ↓
POST /users  PATCH/DELETE /users/:id
    ↓         ↓
    └────┬────┘
         ↓
    Usuario Actualizado
```

---
