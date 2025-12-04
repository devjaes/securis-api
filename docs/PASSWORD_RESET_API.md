# 🔐 API de Recuperación de Contraseña - Documentación Frontend

## 📋 Información General

**Base URL:** `http://localhost:3000/api` (o la URL de tu backend en producción)

Esta API permite a los usuarios solicitar un restablecimiento de contraseña mediante un enlace enviado por correo electrónico. El flujo es seguro y utiliza tokens cifrados con expiración.

---

## 🔄 Flujo Completo

```
1. Usuario solicita recuperación → POST /auth/forgot-password { email }
   ↓
2. Backend genera token cifrado, lo guarda en BD, envía email
   ↓
3. Usuario recibe email con link → {FRONTEND_URL}/auth/reset-password?token={cifrado}
   ↓
4. Usuario ingresa nueva contraseña → POST /auth/reset-password { token, password }
   ↓
5. Backend valida token, actualiza contraseña, marca token como usado
```

---

## 🚀 Endpoints Disponibles

### 1. Solicitar Recuperación de Contraseña

**Endpoint:** `POST /auth/forgot-password`

**Descripción:** Solicita un enlace de recuperación de contraseña. El backend enviará un email con un token cifrado si el correo está registrado. Por seguridad, siempre retorna el mismo mensaje independientemente de si el email existe.

**Request:**

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@uta.edu.ec"
}
```

**Body Parameters:**

- `email` (string, requerido): Email del usuario que solicita la recuperación

**Response - Éxito (200 OK):**

```json
{
  "message": "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña."
}
```

**Nota:** El backend siempre retorna este mensaje por seguridad, incluso si el email no existe en el sistema.

---

### 2. Restablecer Contraseña

**Endpoint:** `POST /auth/reset-password`

**Descripción:** Restablece la contraseña usando el token recibido por email. El token viene cifrado y debe enviarse tal cual.

**⚠️ IMPORTANTE:** Este endpoint está sujeto a encriptación Huffman. El body debe enviarse encriptado.

**Request:**

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "payload": "{huffman_encoded_data}"
}
```

**Body (desencriptado):**

```json
{
  "token": "token_cifrado_recibido_en_el_email",
  "password": "nueva_contraseña"
}
```

**Body Parameters:**

- `token` (string, requerido): Token cifrado recibido en el email (viene en el query param del link)
- `password` (string, requerido): Nueva contraseña (mínimo 6 caracteres)

**Response - Éxito (200 OK):**

```json
{
  "message": "Contraseña restablecida exitosamente"
}
```

**Response - Error (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": "Token inválido o expirado"
}
```

**Response - Error (400 Bad Request - Token usado):**

```json
{
  "statusCode": 400,
  "message": "Este token ya fue utilizado"
}
```

---

## ⚠️ Manejo de Errores

### Error: Token inválido o expirado (400 Bad Request)

**Cuándo ocurre:**

- El token no existe en la base de datos
- El token expiró (válido por 1 hora)
- El token fue malformado

**Response:**

```json
{
  "statusCode": 400,
  "message": "Token inválido o expirado"
}
```

**Acción del Frontend:**

```typescript
try {
  await PasswordResetService.resetPassword(token, password);
} catch (error) {
  if (error.message.includes('Token inválido') || error.message.includes('expirado')) {
    // Mostrar mensaje y opción para solicitar nuevo enlace
    setError('El enlace de recuperación es inválido o expiró. Por favor, solicita uno nuevo.');
    setShowRequestNewLink(true);
  }
}
```

### Error: Token ya utilizado (400 Bad Request)

**Cuándo ocurre:**

- El usuario ya usó este token para restablecer su contraseña
- Los tokens solo pueden usarse una vez

**Response:**

```json
{
  "statusCode": 400,
  "message": "Este token ya fue utilizado"
}
```

**Acción del Frontend:**

```typescript
try {
  await PasswordResetService.resetPassword(token, password);
} catch (error) {
  if (error.message.includes('ya fue utilizado')) {
    setError('Este enlace ya fue utilizado. Por favor, solicita uno nuevo.');
    setShowRequestNewLink(true);
  }
}
```

---

## 📝 Validaciones

### Email (forgot-password)

- **Formato:** Debe ser un email válido
- **Requerido:** Sí

### Token (reset-password)

- **Tipo:** String
- **Requerido:** Sí
- **Formato:** Token cifrado recibido en el email (viene en el query param)

### Contraseña (reset-password)

- **Mínimo:** 6 caracteres
- **Tipo:** String
- **Requerido:** Sí

---

## 🔐 Seguridad

### Características de Seguridad

1. **Tokens Cifrados:** Los tokens se cifran usando Huffman antes de guardarse y enviarse
2. **Expiración:** Los tokens expiran después de 1 hora
3. **Uso Único:** Cada token solo puede usarse una vez
4. **No Revelación:** El backend no revela si un email existe o no
5. **Encriptación:** El endpoint de reset-password está sujeto a encriptación Huffman

### Flujo Seguro

```
Usuario solicita recuperación
  ↓
Backend genera token aleatorio (32 bytes)
  ↓
Token se cifra con Huffman
  ↓
Token cifrado se guarda en BD con expiración
  ↓
Email se envía con token cifrado en el link
  ↓
Usuario hace clic en link → Frontend recibe token cifrado
  ↓
Frontend envía token cifrado + nueva contraseña (todo encriptado)
  ↓
Backend valida token, actualiza contraseña, marca token como usado
```

---

## ✅ Checklist de Implementación

- [ ] Crear servicio de recuperación de contraseña (`PasswordResetService`)
- [ ] Crear componente de formulario "Olvidé mi contraseña"
- [ ] Crear componente de formulario "Restablecer contraseña"
- [ ] Crear página `/auth/forgot-password`
- [ ] Crear página `/auth/reset-password` que lea token de query params
- [ ] Manejar errores (token inválido, expirado, usado)
- [ ] Implementar encriptación Huffman para reset-password
- [ ] Validar contraseña en frontend (mínimo 6 caracteres, coincidencia)
- [ ] Agregar loading states
- [ ] Agregar mensajes de éxito/error
- [ ] Agregar link "Volver al login" en formularios
- [ ] Probar flujo completo end-to-end

---

## 🎯 Flujo Visual

```
Login Page
    ↓
"¿Olvidaste tu contraseña?" link
    ↓
Forgot Password Page
    ↓
POST /auth/forgot-password { email }
    ↓
Email recibido con link
    ↓
Click en link → Reset Password Page
    ↓
POST /auth/reset-password { token, password }
    ↓
Contraseña restablecida → Redirect a Login
```

---

## 📧 Formato del Email

El email que recibe el usuario contiene:

- **Asunto:** "Recuperación de Contraseña - Securis"
- **Contenido HTML:** Template bonito con botón y link
- **Link:** `{FRONTEND_URL}/auth/reset-password?token={token_cifrado}`
- **Expiración:** 1 hora

---

## 🔗 URLs Base

- **API:** `http://localhost:3000/api`
- **Solicitar Recuperación:** `POST http://localhost:3000/api/auth/forgot-password`
- **Restablecer Contraseña:** `POST http://localhost:3000/api/auth/reset-password`
- **Frontend - Solicitar:** `http://localhost:5173/auth/forgot-password`
- **Frontend - Restablecer:** `http://localhost:5173/auth/reset-password?token=...`

---

¿Necesitas ayuda con alguna parte específica de la implementación?
