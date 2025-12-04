# 🔐 API de Login con Credenciales - Documentación Frontend

## 📋 Información General

**Base URL:** `http://localhost:3000/api` (o la URL de tu backend en producción)

**Autenticación:** JWT Bearer Token (después del login)

**Encriptación:** Los endpoints soportan datos encriptados con Huffman. Ver sección de [Encriptación](#-encriptación) más abajo.

---

## 🚀 Endpoint de Login

### Login con Email y Contraseña

**Endpoint:** `POST /auth/login`

**Descripción:** Autentica un usuario usando email y contraseña. Retorna un JWT token que debe usarse para requests autenticados.

**Request:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@uta.edu.ec",
  "password": "tu_contraseña"
}
```

**Body Parameters:**

- `email` (string, requerido): Email del usuario
- `password` (string, requerido): Contraseña del usuario

**Response - Éxito (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@uta.edu.ec",
    "name": "Nombre Usuario",
    "microsoftId": null
  },
  "message": "Login exitoso"
}
```

**Response - Error (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas"
}
```

**Otros errores posibles:**

- `"PASSWORD_NOT_SET"` - El usuario no tiene contraseña configurada. Debe establecer una primero.
  ```json
  {
    "statusCode": 401,
    "message": "PASSWORD_NOT_SET",
    "error": "Este usuario no tiene contraseña configurada. Debes establecer una contraseña primero."
  }
  ```
- `"Unauthorized"` - Error genérico de autenticación

---

## 🔄 Flujo Completo

### 1. Usuario ingresa credenciales

```javascript
const email = 'usuario@uta.edu.ec';
const password = 'mi_contraseña';
```

### 2. Frontend envía request

```javascript
POST /api/auth/login
{
  "email": "usuario@uta.edu.ec",
  "password": "mi_contraseña"
}
```

### 3. Backend valida y responde

**Si las credenciales son correctas:**

```json
{
  "access_token": "eyJhbGc...",
  "user": { ... },
  "message": "Login exitoso"
}
```

**Si las credenciales son incorrectas:**

```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas"
}
```

### 4. Frontend guarda token

```javascript
localStorage.setItem('auth_token', data.access_token);
```

### 5. Usar token en requests autenticados

```javascript
fetch('http://localhost:3000/api/auth/me', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  },
});
```

---

## ⚠️ Manejo de Errores

### Errores Comunes

| Error                    | Causa                          | Solución                                                              |
| ------------------------ | ------------------------------ | --------------------------------------------------------------------- |
| `Credenciales inválidas` | Email o contraseña incorrectos | Verificar credenciales                                                |
| `PASSWORD_NOT_SET`       | Usuario sin contraseña         | Redirigir a `/auth/set-password?email=...` para establecer contraseña |
| `401 Unauthorized`       | Token inválido/expirado        | Re-autenticarse                                                       |
| CORS Error               | Frontend no permitido          | Agregar dominio en CORS backend                                       |

### Manejo de Error PASSWORD_NOT_SET

Cuando un usuario intenta hacer login sin tener contraseña configurada:

```javascript
try {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.message === 'PASSWORD_NOT_SET') {
      // Redirigir a página para establecer contraseña
      window.location.href = `/auth/set-password?email=${encodeURIComponent(email)}`;
      return;
    }
    throw new Error(data.message || 'Error al iniciar sesión');
  }

  // Login exitoso
  localStorage.setItem('auth_token', data.access_token);
} catch (error) {
  console.error('Error:', error);
}
```

**Ver documentación completa:** [SET_PASSWORD_API.md](./SET_PASSWORD_API.md)

## 🔗 Endpoints Relacionados

### Obtener Perfil del Usuario

Después del login, puedes obtener el perfil completo:

```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:**

```json
{
  "id": "uuid",
  "email": "usuario@uta.edu.ec",
  "name": "Nombre Usuario",
  "microsoftId": null
}
```

---

## 📝 Notas Importantes

1. **Token JWT:**
   - Expira en 7 días (configurable)
   - Debe incluirse en header `Authorization: Bearer {token}`
   - Guarda el token de forma segura (localStorage para desarrollo, httpOnly cookies para producción)

2. **Seguridad:**
   - Nunca envíes la contraseña en logs o consola
   - Usa HTTPS en producción
   - Valida el email en el frontend antes de enviar

3. **Usuarios sin contraseña:**
   - Si un usuario fue creado sin contraseña, debe usar login con Microsoft
   - El admin puede agregar contraseña después con `PATCH /api/users/:id`

4. **Validación Frontend:**
   - Valida formato de email antes de enviar
   - Muestra feedback visual durante el proceso
   - Maneja estados de loading

---

## ✅ Checklist de Implementación

- [ ] Crear formulario de login con campos email y password
- [ ] Implementar función de login que llame al endpoint
- [ ] **Detectar error `PASSWORD_NOT_SET` y redirigir a establecer contraseña**
- [ ] Crear página `/auth/set-password` para establecer contraseña
- [ ] Guardar token en localStorage (o estado global)
- [ ] Guardar información del usuario
- [ ] Manejar errores y mostrar mensajes apropiados
- [ ] Redirigir al dashboard después de login exitoso
- [ ] Implementar logout (limpiar token)
- [ ] Agregar interceptor para incluir token en requests
- [ ] Manejar expiración de token (redirigir al login)

---
