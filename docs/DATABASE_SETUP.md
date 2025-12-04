# 🗄️ Configuración de Base de Datos

## Opción 1: Usar Docker Compose (Recomendado)

### Paso 1: Iniciar PostgreSQL

```bash
docker-compose up -d postgres
```

Esto iniciará PostgreSQL en el puerto `5431` con:
- **Base de datos:** `securis_db`
- **Usuario:** `postgres`
- **Contraseña:** `postgres`
- **Puerto:** `5431` (mapeado desde 5432 del contenedor)

### Paso 2: Configurar variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Asegúrate de que `DATABASE_URL` sea:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5431/securis_db
```

### Paso 3: Crear las tablas

```bash
# Opción A: Push directo del schema (desarrollo)
npm run db:push

# Opción B: Generar y ejecutar migraciones (producción)
npm run db:generate
npm run db:migrate
```

### Paso 4: Verificar (Opcional)

Abre Drizzle Studio para ver la base de datos:

```bash
npm run db:studio
```

Esto abrirá una interfaz web en `http://localhost:4983`

---

## Opción 2: PostgreSQL Local

### Paso 1: Instalar PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS (con Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Fedora
sudo dnf install postgresql16-server postgresql16
```

### Paso 2: Crear base de datos

```bash
# Conectar a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE securis_db;
CREATE USER securis_user WITH PASSWORD 'securis_password';
GRANT ALL PRIVILEGES ON DATABASE securis_db TO securis_user;
\q
```

### Paso 3: Configurar .env

```env
DATABASE_URL=postgresql://securis_user:securis_password@localhost:5432/securis_db
```

### Paso 4: Crear las tablas

```bash
npm run db:push
```

---

## Verificar Conexión

### Opción A: Usar Drizzle Studio

```bash
npm run db:studio
```

### Opción B: Conectar con psql

```bash
# Docker
docker exec -it securis-db psql -U postgres -d securis_db

# Local
psql -U securis_user -d securis_db
```

Luego ejecuta:
```sql
\dt  -- Listar tablas
SELECT * FROM users;  -- Ver usuarios
```

---

## Comandos Útiles

```bash
# Generar migraciones desde el schema
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Push directo del schema (sin migraciones)
npm run db:push

# Abrir Drizzle Studio
npm run db:studio

# Detener PostgreSQL (Docker)
docker-compose down

# Ver logs de PostgreSQL (Docker)
docker-compose logs postgres
```

---

## Troubleshooting

### Error: "Cannot connect to database"

1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # Docker
   docker-compose ps
   
   # Local
   sudo systemctl status postgresql
   ```

2. Verifica la URL de conexión en `.env`

3. Verifica que el puerto sea correcto (5431 para Docker, 5432 para local)

### Error: "database does not exist"

Crea la base de datos manualmente:
```sql
CREATE DATABASE securis_db;
```

### Error: "password authentication failed"

Verifica las credenciales en `.env` y en PostgreSQL.

---

## Estructura de Tablas

Después de ejecutar las migraciones, tendrás:

### `users`
- `id` (UUID, PK)
- `microsoft_id` (VARCHAR, UNIQUE)
- `email` (TEXT, UNIQUE, NOT NULL)
- `name` (TEXT, NOT NULL)
- `qr_signature` (TEXT, nullable)
- `password_hash` (TEXT, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)


