# 🔐 API de Autenticación con Microsoft - Documentación Frontend

## 📋 Información General

**Base URL:** `http://localhost:3000/api/v1` (o la URL de tu backend en producción)

**Prefijo de API:** `/api/v1`

**Autenticación:** JWT Bearer Token (para endpoints protegidos)

---

## 🚀 Endpoints Disponibles

### 1. Iniciar Autenticación con Microsoft

**Endpoint:** `GET /auth/microsoft`

**Descripción:** Inicia el flujo OAuth 2.0 con Microsoft. Redirige automáticamente al usuario a la página de login de Microsoft.

**Request:**

```http
GET /api/v1/auth/microsoft
```

**Headers:** No requiere headers

**Query Parameters:** Ninguno

**Response:**

- **Status:** `302 Found` (Redirección)
- **Location:** URL de Microsoft para autenticación
- **Body:** Ninguno (redirección automática)

**Ejemplo de uso:**

```javascript
// En el frontend, simplemente redirige al usuario a esta URL
window.location.href = 'http://localhost:3000/api/v1/auth/microsoft';
```

**Notas:**

- Este endpoint NO devuelve JSON, realiza una redirección HTTP 302
- El usuario será redirigido a Microsoft para autenticarse
- Después de autenticarse, Microsoft redirigirá al callback

---

### 2. Callback de Autenticación (Microsoft)

**Endpoint:** `GET /auth/microsoft/callback`

**Descripción:** Endpoint de callback que recibe la respuesta de Microsoft después de la autenticación. Este endpoint:

1. Valida el código de autorización de Microsoft
2. Intercambia el código por tokens de acceso
3. Obtiene el perfil del usuario desde Microsoft Graph
4. Busca o crea el usuario en la base de datos
5. Genera un JWT token
6. Redirige al frontend con el token

**Request:**

```http
GET /api/v1/auth/microsoft/callback?code={authorization_code}&state={state}
```

**Headers:** No requiere headers (Microsoft envía los parámetros en la URL)

**Query Parameters:**

- `code` (string, requerido): Código de autorización de Microsoft
- `state` (string, opcional): Estado para prevenir CSRF

**Response - Éxito:**

- **Status:** `302 Found` (Redirección)
- **Location:** `{FRONTEND_URL}/auth/callback?token={jwt_token}`
- **Body:** Ninguno

**Response - Error:**

- **Status:** `302 Found` (Redirección)
- **Location:** `{FRONTEND_URL}/auth/error?message={error_message}`
- **Body:** Ninguno

**Ejemplo de redirección exitosa:**

```
http://localhost:5173/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de redirección con error:**

```
http://localhost:5173/auth/error?message=Only%20%40uta.edu.ec%20emails%20are%20allowed
```

**Mensajes de error posibles:**

- `"No email found in Microsoft profile"` - No se encontró email en el perfil
- `"Only @uta.edu.ec emails are allowed"` - El email no es del dominio permitido
- `"Authentication failed"` - Error genérico de autenticación

**Notas:**

- Este endpoint es llamado automáticamente por Microsoft, NO debe ser llamado directamente desde el frontend
- El token JWT se pasa como query parameter (en desarrollo)
- En producción, considera usar cookies httpOnly para mayor seguridad

---

### 3. Obtener Perfil del Usuario Autenticado

**Endpoint:** `GET /auth/me`

**Descripción:** Obtiene la información del usuario autenticado usando el JWT token.

**Request:**

```http
GET /api/v1/auth/me
Authorization: Bearer {jwt_token}
```

**Headers:**

- `Authorization` (string, requerido): Bearer token JWT

**Query Parameters:** Ninguno

**Response - Éxito (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@uta.edu.ec",
  "name": "Juan Pérez",
  "microsoftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response - Error (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Ejemplo de uso:**

```javascript
const response = await fetch('http://localhost:3000/api/v1/auth/me', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

if (response.ok) {
  const user = await response.json();
  console.log('Usuario:', user);
} else {
  console.error('Error al obtener perfil');
}
```

**Notas:**

- Requiere autenticación JWT válida
- El token debe estar en el header `Authorization` con el formato `Bearer {token}`
- Si el token es inválido o expiró, devuelve 401

---

## 🔄 Flujo Completo de Autenticación

### Paso 1: Usuario hace clic en "Iniciar sesión con Microsoft"

```javascript
// En tu componente de login
const handleMicrosoftLogin = () => {
  window.location.href = 'http://localhost:3000/api/v1/auth/microsoft';
};
```

### Paso 2: Usuario es redirigido a Microsoft

- El backend redirige automáticamente a Microsoft
- El usuario ingresa sus credenciales en Microsoft
- Microsoft valida las credenciales

### Paso 3: Microsoft redirige al callback

- Microsoft redirige a: `http://localhost:3000/api/v1/auth/microsoft/callback?code=...`
- El backend procesa la autenticación
- El backend redirige al frontend con el token

### Paso 4: Frontend recibe el token

```javascript
// En tu página /auth/callback
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const error = searchParams.get('message');

  useEffect(() => {
    if (error) {
      // Manejar error
      console.error('Error de autenticación:', error);
      navigate('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (token) {
      // Guardar token en localStorage o estado global
      localStorage.setItem('auth_token', token);

      // Redirigir al dashboard o página principal
      navigate('/dashboard');
    }
  }, [token, error, navigate]);

  return <div>Cargando...</div>;
}
```

### Paso 5: Usar el token para requests autenticados

```javascript
// Función helper para hacer requests autenticados
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('auth_token');

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

// Obtener perfil del usuario
const getUserProfile = async () => {
  const response = await fetchWithAuth('http://localhost:3000/api/v1/auth/me');
  if (response.ok) {
    return await response.json();
  }
  throw new Error('Error al obtener perfil');
};
```

---

## 📝 Estructura del JWT Token

El token JWT contiene el siguiente payload:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000", // ID del usuario
  "email": "usuario@uta.edu.ec",
  "name": "Juan Pérez",
  "microsoftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "iat": 1234567890, // Issued at (timestamp)
  "exp": 1234567890 // Expiration (timestamp)
}
```

**Expiración:** Por defecto 7 días (configurable en `JWT_EXPIRATION`)

---

## 🛠️ Implementación Frontend Recomendada

### 1. Página de Login

```jsx
// pages/Login.jsx
function Login() {
  const handleMicrosoftLogin = () => {
    window.location.href = 'http://localhost:3000/api/v1/auth/microsoft';
  };

  return (
    <div>
      <h1>Iniciar Sesión</h1>
      <button onClick={handleMicrosoftLogin}>Iniciar sesión con Microsoft</button>
    </div>
  );
}
```

### 2. Página de Callback

```jsx
// pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('message');

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      // Guardar token
      localStorage.setItem('auth_token', token);

      // Opcional: Obtener perfil del usuario
      fetch('http://localhost:3000/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((user) => {
          // Guardar usuario en estado global (Redux, Context, etc.)
          navigate('/dashboard');
        })
        .catch(() => {
          navigate('/login?error=Error al obtener perfil');
        });
    } else {
      navigate('/login?error=No se recibió token');
    }
  }, [searchParams, navigate]);

  return <div>Cargando...</div>;
}
```

### 3. Página de Error

```jsx
// pages/AuthError.jsx
import { useSearchParams, useNavigate } from 'react-router-dom';

function AuthError() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorMessage = searchParams.get('message') || 'Error desconocido';

  return (
    <div>
      <h1>Error de Autenticación</h1>
      <p>{errorMessage}</p>
      <button onClick={() => navigate('/login')}>Volver al login</button>
    </div>
  );
}
```

### 4. Hook de Autenticación (React)

```jsx
// hooks/useAuth.js
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      setLoading(false);
      return;
    }

    // Verificar token y obtener usuario
    fetch('http://localhost:3000/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Token inválido');
      })
      .then((userData) => {
        setUser(userData);
        setIsAuthenticated(true);
      })
      .catch(() => {
        // Token inválido, limpiar
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = () => {
    window.location.href = 'http://localhost:3000/api/v1/auth/microsoft';
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };
}
```

### 5. Protected Route Component

```jsx
// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

---

## ⚠️ Consideraciones de Seguridad

### Desarrollo (Actual)

- ✅ El token se pasa como query parameter en la URL
- ⚠️ El token es visible en la URL y en el historial del navegador
- ⚠️ No es la forma más segura, pero funciona para desarrollo

### Producción (Recomendado)

- 🔒 Usar cookies httpOnly para almacenar el token
- 🔒 Implementar refresh tokens
- 🔒 Usar HTTPS siempre
- 🔒 Validar el origen de las redirecciones

---

## 🐛 Manejo de Errores

### Errores Comunes

1. **401 Unauthorized**
   - Token inválido o expirado
   - Solución: Redirigir al login

2. **CORS Error**
   - El frontend no está en la lista de orígenes permitidos
   - Solución: Agregar el dominio del frontend en la configuración CORS del backend

3. **Token no recibido en callback**
   - Error en el flujo de autenticación
   - Solución: Verificar que el callback URL esté configurado correctamente en Azure AD

---

## 📋 Checklist para el Frontend

- [ ] Crear página de login con botón "Iniciar sesión con Microsoft"
- [ ] Crear página `/auth/callback` para recibir el token
- [ ] Crear página `/auth/error` para mostrar errores
- [ ] Implementar almacenamiento del token (localStorage o estado global)
- [ ] Crear hook/context de autenticación
- [ ] Implementar componente de rutas protegidas
- [ ] Agregar interceptor para incluir token en requests
- [ ] Manejar expiración del token (redirigir al login)
- [ ] Implementar logout (limpiar token y redirigir)

---

## 🔗 URLs Importantes

- **Backend API:** `http://localhost:3000/api/v1`
- **Login Microsoft:** `http://localhost:3000/api/v1/auth/microsoft`
- **Callback:** `http://localhost:3000/api/v1/auth/microsoft/callback` (automático)
- **Perfil Usuario:** `http://localhost:3000/api/v1/auth/me` (requiere token)

---

## 📝 Variables de Entorno del Backend

Asegúrate de que el backend tenga configurado:

```env
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_TENANT_ID=tu_tenant_id
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/v1/auth/microsoft/callback
FRONTEND_URL=http://localhost:5173
JWT_SECRET=tu_jwt_secret
JWT_EXPIRATION=7d
```

---

## 🚧 Lo que falta implementar (Opcional)

1. **Refresh Token Endpoint**
   - Endpoint para renovar el token sin re-autenticarse
   - Actualmente el usuario debe volver a iniciar sesión cuando expira

2. **Logout Endpoint**
   - Endpoint para invalidar tokens (blacklist)
   - Actualmente el logout es solo del lado del frontend

3. **Mejorar seguridad del token en producción**
   - Usar cookies httpOnly en lugar de query params
   - Implementar CSRF protection

4. **Validación de dominio más estricta**
   - Validar dominio en el frontend también
   - Mostrar mensajes de error más amigables

---

¿Necesitas ayuda con alguna implementación específica del frontend?

