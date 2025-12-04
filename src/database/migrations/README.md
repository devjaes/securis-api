# 📦 Migraciones de Base de Datos

Esta carpeta contiene migraciones SQL manuales para la base de datos.

## 📝 Migraciones Disponibles

### `0001_create_admin_user.sql`
Crea el usuario administrador inicial:
- **Email:** `pvillacres6317@uta.edu.ec`
- **Nombre:** `Pablo Villacres`
- **ID:** `00000000-0000-0000-0000-000000000001`

## 🚀 Ejecutar Migraciones

### Opción 1: Directamente con psql

```bash
docker compose exec -T postgres psql -U postgres -d securis_db < src/database/migrations/0001_create_admin_user.sql
```

### Opción 2: Usando el script TypeScript

```bash
tsx scripts/run-migration.ts 0001_create_admin_user.sql
```

### Opción 3: Desde psql interactivo

```bash
docker compose exec postgres psql -U postgres -d securis_db

# Luego dentro de psql:
\i /path/to/migration.sql
```

## 📋 Crear Nueva Migración

1. Crea un archivo SQL en esta carpeta con el formato:
   ```
   XXXX_description.sql
   ```
   Donde `XXXX` es un número secuencial.

2. Escribe tu SQL:
   ```sql
   -- Migration: Descripción
   -- Created: YYYY-MM-DD
   -- Description: Qué hace esta migración

   -- Tu SQL aquí
   ```

3. Ejecuta la migración usando una de las opciones arriba.

## ⚠️ Notas

- Las migraciones se ejecutan manualmente (no automáticamente)
- Usa `ON CONFLICT DO NOTHING` para evitar errores si ya existe
- Siempre verifica que la migración se ejecutó correctamente
- Considera hacer backup antes de ejecutar migraciones en producción


