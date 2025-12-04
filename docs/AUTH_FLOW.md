# 🔐 Flujo de Autenticación Actualizado

## 📋 Cambios Implementados

### ❌ Antes (Find or Create)

- Cualquier usuario podía hacer login y se creaba automáticamente
- No había control sobre quién puede acceder

### ✅ Ahora (Find and Update)

- Los usuarios deben ser creados primero por un administrador
- Solo usuarios existentes pueden hacer login
- El login actualiza los datos de Microsoft si el usuario ya existe

---

## 🔄 Flujo Completo

### 1. Creación de Usuario (por Admin)

El administrador crea usuarios en la base de datos con:

- **Email** (requerido)
- **Nombre** (opcional, se actualizará en el primer login)
- Otros datos necesarios

```sql
-- Ejemplo de usuario creado por admin
INSERT INTO users (email, name)
VALUES ('usuario@uta.edu.ec', 'Nombre Usuario');
```

### 2. Login con Microsoft

Cuando un usuario intenta hacer login:

1. **Usuario hace clic en "Iniciar sesión con Microsoft"**
   - Redirige a: `GET /api/auth/microsoft`
   - Backend redirige a Microsoft para autenticación

2. **Usuario se autentica en Microsoft**
   - Microsoft valida credenciales
   - Microsoft redirige al callback

3. **Backend procesa el callback**
   - `GET /api/auth/microsoft/callback?code=...`
   - Backend obtiene datos del usuario desde Microsoft Graph
   - **Busca usuario por email en la base de datos**

4. **Resultados posibles:**

   **✅ Usuario existe:**
   - Actualiza `microsoftId` si no existe
   - Actualiza `name` si es diferente
   - Genera JWT token
   - Redirige al frontend con el token

   **❌ Usuario NO existe:**
   - Lanza error: `USER_NOT_REGISTERED`
   - Redirige al frontend con mensaje de error:
     ```
     /auth/error?message=Usuario no registrado. Contacta al administrador para crear tu cuenta.
     ```

---

## 📝 Código Actualizado

### `auth.service.ts`

```typescript
/**
 * Busca un usuario por email y actualiza sus datos de Microsoft.
 * Si el usuario no existe, lanza una excepción.
 */
async findAndUpdateUser(microsoftUser: MicrosoftUser): Promise<User> {
  // Buscar usuario por email (el admin crea usuarios solo con email)
  const userByEmail = await this.db
    .select()
    .from(users)
    .where(eq(users.email, microsoftUser.email))
    .limit(1);

  if (userByEmail.length === 0) {
    throw new Error('USER_NOT_REGISTERED');
  }

  const existingUser = userByEmail[0];

  // Actualizar datos de Microsoft (microsoftId, name, etc.)
  // ... código de actualización ...

  return existingUser;
}
```

### `auth.controller.ts`

```typescript
try {
  // Buscar usuario en la base de datos y actualizar datos de Microsoft
  // Si no existe, se lanzará un error
  const user = await this.authService.findAndUpdateUser(microsoftUser);

  // Generar JWT token y redirigir
  // ...
} catch (error) {
  // Manejar error específico de usuario no registrado
  if (error.message === 'USER_NOT_REGISTERED') {
    errorMessage = 'Usuario no registrado. Contacta al administrador para crear tu cuenta.';
  }
  // Redirigir con error
}
```

---

## 🎯 Próximos Pasos

### 1. Endpoint para Crear Usuarios (Admin)

Necesitarás crear un endpoint para que el admin pueda crear usuarios:

```typescript
@Post('users')
@UseGuards(AuthGuard('jwt'))
@Roles('admin') // Necesitarás implementar roles
async createUser(@Body() createUserDto: CreateUserDto) {
  // Crear usuario solo con email y nombre básico
  // El microsoftId se actualizará en el primer login
}
```

### 2. Login con Contraseña

Para usuarios que prefieren login con contraseña:

```typescript
@Post('login')
async loginWithPassword(@Body() loginDto: { email: string; password: string }) {
  // Buscar usuario por email
  // Verificar contraseña (bcrypt)
  // Generar JWT token
}
```

### 3. Schema de Usuarios

Asegúrate de que el schema permita usuarios sin `microsoftId` inicialmente:

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  microsoftId: varchar('microsoft_id', { length: 255 }).unique().nullable(), // ← nullable
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').nullable(), // Para login con contraseña
  // ...
});
```

---

## 🔍 Validaciones

### Email Matching

El sistema busca usuarios **exactamente por email**:

- El email de Microsoft debe coincidir exactamente con el email en la BD
- No hay búsqueda por dominio parcial
- Case-sensitive (depende de la configuración de PostgreSQL)

### Actualización de Datos

Se actualizan automáticamente:

- ✅ `microsoftId` - Si no existe o es diferente
- ✅ `name` - Si es diferente al almacenado
- ✅ `updatedAt` - Siempre se actualiza

No se actualizan:

- ❌ `email` - No se cambia (debe coincidir)
- ❌ `passwordHash` - Solo se actualiza en login con contraseña
- ❌ Otros campos personalizados

---

## 🐛 Manejo de Errores

### Error: `USER_NOT_REGISTERED`

**Cuándo ocurre:**

- Usuario intenta login con Microsoft
- El email no existe en la base de datos

**Mensaje al usuario:**

```
"Usuario no registrado. Contacta al administrador para crear tu cuenta."
```

**Solución:**

- Admin debe crear el usuario con el email correspondiente
- Usuario puede intentar login nuevamente

---

## 📊 Ejemplo de Flujo

### Escenario 1: Usuario Existente

1. Admin crea usuario:

   ```sql
   INSERT INTO users (email, name)
   VALUES ('juan@uta.edu.ec', 'Juan Pérez');
   ```

2. Usuario hace login con Microsoft:
   - Email de Microsoft: `juan@uta.edu.ec`
   - Sistema encuentra el usuario
   - Actualiza `microsoftId` y `name` si es necesario
   - Genera token JWT
   - ✅ Login exitoso

### Escenario 2: Usuario No Existente

1. Usuario intenta login con Microsoft:
   - Email de Microsoft: `nuevo@uta.edu.ec`
   - Sistema NO encuentra el usuario
   - ❌ Error: `USER_NOT_REGISTERED`
   - Mensaje: "Usuario no registrado..."

2. Admin crea el usuario:

   ```sql
   INSERT INTO users (email, name)
   VALUES ('nuevo@uta.edu.ec', 'Nuevo Usuario');
   ```

3. Usuario intenta login nuevamente:
   - ✅ Ahora funciona correctamente

---

## ✅ Checklist de Implementación

- [x] Cambiar `findOrCreateUser` a `findAndUpdateUser`
- [x] Lanzar error si usuario no existe
- [x] Actualizar datos de Microsoft si usuario existe
- [x] Manejar error `USER_NOT_REGISTERED` en el controlador
- [x] Redirigir con mensaje de error apropiado
- [ ] Crear endpoint para admin crear usuarios
- [ ] Implementar login con contraseña
- [ ] Agregar roles/permissions para admin
- [ ] Actualizar documentación de API

---

¿Necesitas ayuda implementando el endpoint para crear usuarios o el login con contraseña?
