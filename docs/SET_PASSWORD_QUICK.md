# 🔑 Establecer Contraseña - Guía Rápida

## ⚠️ IMPORTANTE: Usa el endpoint correcto

### ❌ NO uses este (requiere JWT):
```
POST /api/auth/set-password
Authorization: Bearer {token}  ← No tienes token si no tienes contraseña
```

### ✅ USA este (sin autenticación):
```
POST /api/auth/set-password/pvillacres6317@uta.edu.ec
Content-Type: application/json

{
  "password": "tu_contraseña"
}
```

---

## 💻 Ejemplo Rápido

```javascript
// Establecer contraseña por primera vez
const email = 'pvillacres6317@uta.edu.ec';
const password = 'mi_contraseña_segura';

const response = await fetch(
  `http://localhost:3000/api/auth/set-password/${encodeURIComponent(email)}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  }
);

const data = await response.json();
// { message: "Contraseña establecida exitosamente" }
```

---

## 🔄 Flujo Completo

1. **Usuario intenta login** → Error `PASSWORD_NOT_SET`
2. **Frontend redirige** → `/auth/set-password?email=...`
3. **Usuario establece contraseña** → `POST /api/auth/set-password/:email`
4. **Usuario hace login** → `POST /api/auth/login` ✅

---

## 📝 Notas

- El email va en la **URL**, no en el body
- El email debe estar **URL encoded** si tiene caracteres especiales
- La contraseña debe tener **mínimo 6 caracteres**
- Este endpoint **NO requiere autenticación**

---

Para más detalles, ver [SET_PASSWORD_API.md](./SET_PASSWORD_API.md)




