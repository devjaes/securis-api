# 🔑 API para Establecer Contraseña - Documentación Frontend

## 📋 Información General

**Base URL:** `http://localhost:3000/api` (o la URL de tu backend en producción)

Este endpoint permite a los usuarios establecer su contraseña por primera vez o cambiarla. **El endpoint está encriptado**, por lo que el body debe enviarse usando el sistema de encriptación Huffman.

---

## 🚀 Endpoint Único

### `POST /auth/set-password`

**Descripción:** Endpoint único que maneja tanto el establecimiento de contraseña por primera vez como el cambio de contraseña para usuarios autenticados.

**Cómo funciona:**

- **Primera vez (sin contraseña):** Envía `email` e `isFirstTime: true` en el body. **NO requiere JWT**.
- **Cambiar contraseña (ya autenticado):** Solo envía `password` en el body. **Requiere JWT**.

---

## 📝 Request

### Para Primera Vez (Sin Contraseña)

```http
POST /api/auth/set-password
Content-Type: application/json

{
  "password": "nueva_contraseña",
  "email": "usuario@uta.edu.ec",
  "isFirstTime": true
}
```

**Body Parameters:**

- `password` (string, requerido): Nueva contraseña (mínimo 6 caracteres)
- `email` (string, requerido si es primera vez): Email del usuario
- `isFirstTime` (boolean, requerido si es primera vez): Debe ser `true` para indicar que es el primer seteo

### Para Cambiar Contraseña (Autenticado)

```http
POST /api/auth/set-password
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "password": "nueva_contraseña"
}
```

**Headers:**

- `Authorization` (string, requerido): Bearer token JWT del usuario autenticado

**Body Parameters:**

- `password` (string, requerido): Nueva contraseña (mínimo 6 caracteres)

---

## ✅ Response - Éxito (200 OK)

```json
{
  "message": "Contraseña establecida exitosamente"
}
```

---

## ❌ Response - Errores

### Error: Usuario no encontrado (401 Unauthorized)

**Cuándo ocurre:** Se intenta establecer contraseña con un email que no existe en la base de datos.

```json
{
  "statusCode": 401,
  "message": "Usuario no encontrado"
}
```

### Error: Usuario no autenticado (401 Unauthorized)

**Cuándo ocurre:** Se intenta cambiar contraseña sin enviar `email` e `isFirstTime`, pero no se proporciona JWT válido.

```json
{
  "statusCode": 401,
  "message": "Usuario no autenticado"
}
```

---

## 💻 Implementación Frontend

### Ejemplo: Establecer Contraseña por Primera Vez

```javascript
async function setPasswordFirstTime(email, password) {
  // ⚠️ IMPORTANTE: El body debe estar encriptado usando Huffman
  // Consulta la documentación de encriptación para más detalles

  const response = await fetch('http://localhost:3000/api/auth/set-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload: huffmanEncode(
        JSON.stringify({
          password: password,
          email: email,
          isFirstTime: true,
        }),
      ),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al establecer contraseña');
  }

  return await response.json();
}
```

### Ejemplo: Cambiar Contraseña (Usuario Autenticado)

```javascript
async function changePassword(newPassword, token) {
  // ⚠️ IMPORTANTE: El body debe estar encriptado usando Huffman
  // Consulta la documentación de encriptación para más detalles

  const response = await fetch('http://localhost:3000/api/auth/set-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      payload: huffmanEncode(
        JSON.stringify({
          password: newPassword,
        }),
      ),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al cambiar contraseña');
  }

  return await response.json();
}
```

### Ejemplo: Página para Establecer Contraseña (React)

```jsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { huffmanEncode } from '@/utils/encryption'; // Tu utilidad de encriptación

function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!email) {
      setError('Email no proporcionado');
      return;
    }

    setLoading(true);

    try {
      // Preparar el body encriptado
      const payload = {
        password: password,
        email: email,
        isFirstTime: true,
      };

      const response = await fetch('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: huffmanEncode(JSON.stringify(payload)),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al establecer contraseña');
      }

      // Contraseña establecida, redirigir al login
      alert('Contraseña establecida exitosamente. Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return <div>Error: Email no proporcionado</div>;
  }

  return (
    <div className="set-password-container">
      <h1>Establecer Contraseña</h1>
      <p>Establece tu contraseña para la cuenta: {email}</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">Nueva Contraseña:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Repite la contraseña"
          />
        </div>

        {error && <div style={{ color: 'red' }}>{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Estableciendo...' : 'Establecer Contraseña'}
        </button>
      </form>
    </div>
  );
}
```

---

## 🔄 Flujo Completo

### Escenario: Usuario sin contraseña intenta hacer login

1. **Usuario intenta login:**

   ```javascript
   POST /api/auth/login
   {
     "email": "usuario@uta.edu.ec",
     "password": "cualquier_cosa"
   }
   ```

2. **Backend responde con error:**

   ```json
   {
     "statusCode": 401,
     "message": "PASSWORD_NOT_SET",
     "error": "Este usuario no tiene contraseña configurada. Debes establecer una contraseña primero."
   }
   ```

3. **Frontend detecta el error y redirige:**

   ```javascript
   if (error.message === 'PASSWORD_NOT_SET') {
     // Redirigir a página de establecer contraseña
     navigate(`/auth/set-password?email=${email}`);
   }
   ```

4. **Usuario establece contraseña:**

   ```javascript
   POST /api/auth/set-password
   {
     "password": "mi_nueva_contraseña",
     "email": "usuario@uta.edu.ec",
     "isFirstTime": true
   }
   ```

5. **Usuario intenta login nuevamente:**

   ```javascript
   POST /api/auth/login
   {
     "email": "usuario@uta.edu.ec",
     "password": "mi_nueva_contraseña"
   }
   ```

6. **✅ Login exitoso**

---

## ⚠️ Manejo de Errores

### Error: `PASSWORD_NOT_SET`

**Cuándo ocurre:**

- Usuario intenta login con email/password
- El usuario existe pero no tiene contraseña configurada

**Response:**

```json
{
  "statusCode": 401,
  "message": "PASSWORD_NOT_SET",
  "error": "Este usuario no tiene contraseña configurada. Debes establecer una contraseña primero."
}
```

**Acción del Frontend:**

```javascript
if (error.message === 'PASSWORD_NOT_SET') {
  // Redirigir a página de establecer contraseña
  navigate(`/auth/set-password?email=${email}`);
}
```

---

## 📝 Validaciones

### Contraseña

- **Mínimo:** 6 caracteres
- **Tipo:** String
- **Requerido:** Sí

### Email (para primer seteo)

- **Formato:** Email válido
- **Debe existir:** El usuario debe existir en la base de datos
- **Requerido:** Solo si `isFirstTime` es `true`

### isFirstTime

- **Tipo:** Boolean
- **Requerido:** Solo si es primer seteo
- **Valor:** Debe ser `true` para indicar primer seteo

---

## 🔐 Seguridad

### ✅ Ventajas del Nuevo Sistema

- **Encriptación:** Todo el body está encriptado usando Huffman
- **Email en body:** El email no va en la URL, es más seguro
- **Un solo endpoint:** Más fácil de mantener
- **Flexible:** Soporta tanto primer seteo como cambio de contraseña

### ⚠️ Consideraciones

- **Primer seteo:** No requiere autenticación, pero el email debe existir en la base de datos
- **Cambio de contraseña:** Requiere JWT válido
- **Encriptación:** Asegúrate de usar el sistema de encriptación Huffman en el frontend

---

## ✅ Checklist de Implementación

- [ ] Detectar error `PASSWORD_NOT_SET` en el login
- [ ] Crear página `/auth/set-password` que reciba email por query param
- [ ] Formulario con campo de contraseña y confirmación
- [ ] Validar que las contraseñas coincidan en el frontend
- [ ] Implementar encriptación Huffman para el body
- [ ] Llamar al endpoint `POST /auth/set-password` con `email` e `isFirstTime: true`
- [ ] Mostrar mensaje de éxito
- [ ] Redirigir al login después de establecer contraseña
- [ ] Manejar errores (usuario no encontrado, etc.)

---

## 🎯 Flujo Visual

```
Usuario intenta login
        ↓
¿Tiene contraseña?
    ↙        ↘
  SÍ          NO
  ↓           ↓
Login    Error: PASSWORD_NOT_SET
exitoso       ↓
         Redirigir a /auth/set-password?email=...
              ↓
         Usuario establece contraseña
              ↓
         POST /auth/set-password
         {
           password: "...",
           email: "...",
           isFirstTime: true
         }
              ↓
         ✅ Contraseña establecida
              ↓
         Redirigir a /login
              ↓
         Usuario puede hacer login ahora
```

---

¿Necesitas ayuda con alguna parte específica de la implementación?
