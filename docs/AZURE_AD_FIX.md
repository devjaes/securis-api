# 🔧 Corrección del Redirect URI en Azure AD

## ❌ Problema

Microsoft está redirigiendo a:
```
http://localhost:3000/auth/microsoft/callback
```

Pero tu endpoint está en:
```
http://localhost:3000/api/auth/microsoft/callback
```

Esto causa el error: `Cannot GET /auth/microsoft/callback`

---

## ✅ Solución

### Paso 1: Actualizar Redirect URI en Azure AD

1. Ve a [Azure Portal](https://portal.azure.com)
2. Busca **Azure Active Directory** o **Microsoft Entra ID**
3. Ve a **App registrations** → Tu aplicación
4. Ve a **Authentication**
5. En **Redirect URIs**, busca:
   ```
   http://localhost:3000/auth/microsoft/callback
   ```
6. **Elimínalo** y agrega:
   ```
   http://localhost:3000/api/auth/microsoft/callback
   ```
7. Click en **Save**

### Paso 2: Verificar .env

Asegúrate de que tu `.env` tenga:

```env
API_PREFIX=api
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback
```

### Paso 3: Reiniciar el servidor

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar
npm run start:dev
```

---

## 🔍 Verificar que funciona

1. Visita: `http://localhost:3000/api/auth/microsoft`
2. Deberías ser redirigido a Microsoft
3. Después de autenticarte, Microsoft debería redirigir a:
   ```
   http://localhost:3000/api/auth/microsoft/callback?code=...
   ```
4. Y luego tu backend debería redirigir a:
   ```
   http://localhost:5173/auth/callback?token=...
   ```

---

## 📝 Notas

- El prefijo `/api` viene de `API_PREFIX` en tu `.env`
- Si cambias `API_PREFIX`, también debes actualizar el Redirect URI en Azure AD
- Para producción, usa la URL completa de tu dominio:
  ```
  https://tu-dominio.com/api/auth/microsoft/callback
  ```


