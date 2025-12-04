# 📋 Resumen Ejecutivo - API de Autenticación

## 🎯 Endpoints Disponibles

| Método | Endpoint                       | Autenticación | Encriptación | Descripción                            |
| ------ | ------------------------------ | ------------- | ------------ | -------------------------------------- |
| `POST` | `/api/auth/login`              | ❌ No         | ✅ Sí        | Login con email/password               |
| `POST` | `/api/auth/set-password`       | ⚠️ Opcional   | ✅ Sí        | Establecer/cambiar contraseña          |
| `POST` | `/api/auth/forgot-password`    | ❌ No         | ❌ No        | Solicitar recuperación de contraseña   |
| `POST` | `/api/auth/reset-password`     | ❌ No         | ✅ Sí        | Restablecer contraseña con token       |
| `GET`  | `/api/auth/microsoft`          | ❌ No         | ❌ No        | Inicia login con Microsoft (redirige)  |
| `GET`  | `/api/auth/microsoft/callback` | ❌ No         | ❌ No        | Callback de Microsoft (automático)     |
| `GET`  | `/api/auth/me`                 | ✅ JWT        | ❌ No        | Obtiene perfil del usuario autenticado |

---

## 🔄 Flujos de Autenticación

### Login con Credenciales

```
1. Usuario → POST /auth/login { email, password }
   ↓
2. Backend → Valida credenciales
   ↓
3. Backend → Genera JWT token
   ↓
4. Frontend → Guarda token, redirige a dashboard
```

### Login con Microsoft

```
1. Usuario → GET /auth/microsoft
   ↓
2. Backend → Redirige a Microsoft
   ↓
3. Usuario → Se autentica en Microsoft
   ↓
4. Microsoft → GET /auth/microsoft/callback?code=...
   ↓
5. Backend → Procesa, actualiza usuario, genera JWT
   ↓
6. Backend → Redirige a: {FRONTEND_URL}/auth/callback?token={jwt}
   ↓
7. Frontend → Guarda token, redirige a dashboard
```

---

## 📥 Request/Response

### 1. Login con Credenciales

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@uta.edu.ec",
  "password": "contraseña"
}
```

**Response - Éxito (200):**

```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "usuario@uta.edu.ec",
    "name": "Nombre",
    "microsoftId": null
  },
  "message": "Login exitoso"
}
```

**Response - Error (401):**

```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas"
}
```

---

### 2. Iniciar Login con Microsoft

```http
GET /api/auth/microsoft
```

**Response:** `302 Redirect` → Microsoft

---

### 3. Callback Microsoft (Automático)

```http
GET /api/v1/auth/microsoft/callback?code=xxx&state=xxx
```

**Response - Éxito:**

```
302 Redirect → {FRONTEND_URL}/auth/callback?token=eyJhbGc...
```

**Response - Error:**

```
302 Redirect → {FRONTEND_URL}/auth/error?message=Error%20message
```

---

### 4. Establecer/Cambiar Contraseña

```http
POST /api/auth/set-password
Content-Type: application/json

{
  "payload": "{huffman_encoded_data}"
}
```

**Body (desencriptado) - Primera vez (sin contraseña):**

```json
{
  "password": "nueva_contraseña",
  "email": "usuario@uta.edu.ec",
  "isFirstTime": true
}
```

**Body (desencriptado) - Cambiar contraseña (autenticado):**

```http
POST /api/auth/set-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "payload": "{huffman_encoded_data}"
}
```

```json
{
  "password": "nueva_contraseña"
}
```

**Response - Éxito (200):**

```json
{
  "message": "Contraseña establecida exitosamente"
}
```

**Response - Error (401):**

```json
{
  "statusCode": 401,
  "message": "Usuario no encontrado"
}
```

---

### 5. Obtener Perfil

```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

**Response - Éxito (200):**

```json
{
  "id": "uuid",
  "email": "usuario@uta.edu.ec",
  "name": "Nombre Usuario",
  "microsoftId": "microsoft-id"
}
```

**Response - Error (401):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 💻 Código Frontend Mínimo

### Login con Credenciales

```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@uta.edu.ec',
    password: 'contraseña',
  }),
});
const data = await response.json();
localStorage.setItem('auth_token', data.access_token);
```

### Login con Microsoft

```javascript
window.location.href = 'http://localhost:3000/api/auth/microsoft';
```

### Callback Handler

```javascript
const token = new URLSearchParams(window.location.search).get('token');
if (token) {
  localStorage.setItem('auth_token', token);
  // Redirigir a dashboard
}
```

### Establecer Contraseña (Primera vez)

```javascript
import { huffmanEncode } from '@/utils/encryption';

const payload = {
  password: 'nueva_contraseña',
  email: 'usuario@uta.edu.ec',
  isFirstTime: true,
};

const response = await fetch('http://localhost:3000/api/auth/set-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payload: huffmanEncode(JSON.stringify(payload)),
  }),
});
```

### Establecer Contraseña (Autenticado)

```javascript
import { huffmanEncode } from '@/utils/encryption';

const payload = {
  password: 'nueva_contraseña',
};

const response = await fetch('http://localhost:3000/api/auth/set-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  },
  body: JSON.stringify({
    payload: huffmanEncode(JSON.stringify(payload)),
  }),
});
```

### Solicitar Recuperación de Contraseña

```javascript
const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@uta.edu.ec',
  }),
});
const data = await response.json();
// Siempre retorna el mismo mensaje por seguridad
```

### Restablecer Contraseña

```javascript
import { huffmanEncode } from '@/utils/encryption';

const token = new URLSearchParams(window.location.search).get('token');
const response = await fetch('http://localhost:3000/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payload: huffmanEncode(
      JSON.stringify({
        token: token,
        password: 'nueva_contraseña',
      }),
    ),
  }),
});
const data = await response.json();
```

### Request Autenticado

```javascript
fetch('http://localhost:3000/api/auth/me', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  },
});
```

---

## ⚠️ Errores Comunes

| Error                                 | Causa                          | Solución                                                                           |
| ------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| `PASSWORD_NOT_SET`                    | Usuario sin contraseña         | Redirigir a `/auth/set-password?email=...` y usar endpoint con `isFirstTime: true` |
| `Credenciales inválidas`              | Email/password incorrectos     | Verificar credenciales                                                             |
| `Token inválido o expirado`           | Token de recuperación inválido | Solicitar nuevo enlace de recuperación                                             |
| `Este token ya fue utilizado`         | Token de recuperación usado    | Solicitar nuevo enlace de recuperación                                             |
| `Only @uta.edu.ec emails are allowed` | Email no es del dominio        | Usar cuenta @uta.edu.ec                                                            |
| `No email found in Microsoft profile` | Perfil sin email               | Verificar permisos en Azure AD                                                     |
| `401 Unauthorized`                    | Token inválido/expirado        | Re-autenticarse                                                                    |
| CORS Error                            | Frontend no permitido          | Agregar dominio en CORS backend                                                    |

---

## ✅ Checklist Frontend

- [ ] Página login con botón Microsoft
- [ ] Página `/auth/callback` para recibir token
- [ ] Página `/auth/error` para errores
- [ ] Guardar token (localStorage/estado)
- [ ] Hook/Context de autenticación
- [ ] Rutas protegidas
- [ ] Interceptor para agregar token a requests
- [ ] Manejo de expiración de token
- [ ] Función logout

---

## 🔗 URLs Base

- **API:** `http://localhost:3000/api`
- **Login Credenciales:** `POST http://localhost:3000/api/auth/login`
- **Login Microsoft:** `GET http://localhost:3000/api/auth/microsoft`
- **Solicitar Recuperación:** `POST http://localhost:3000/api/auth/forgot-password`
- **Restablecer Contraseña:** `POST http://localhost:3000/api/auth/reset-password`
- **Perfil:** `GET http://localhost:3000/api/auth/me` (requiere token)

---

Para más detalles, ver:

- [AUTH_API.md](./AUTH_API.md) - Autenticación completa
- [PASSWORD_RESET_API.md](./PASSWORD_RESET_API.md) - Recuperación de contraseña
