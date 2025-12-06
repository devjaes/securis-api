API desarrollada con NestJS

## Requisitos Previos

- **Node.js**: Versión 24 LTS
- **pnpm**: Gestor de paquetes (instalar con `npm install -g pnpm`)
- **Docker** y **Docker Compose**: Para la base de datos de desarrollo

## Instalación

1. Clonar el repositorio:

```bash
git clone <url-del-repositorio>
```

2. Instalar dependencias:

```bash
pnpm install
```

3. Crear el archivo de configuración `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` y configura las siguientes variables de entorno según tu entorno local:

- `PORT`: Puerto en el que correrá la aplicación (por defecto: 3000)
- `DB_SERVER`: Servidor de SQL Server (por defecto: localhost)
- `DB_PORT`: Puerto de SQL Server (por defecto: 1433)
- `DB_NAME`: Nombre de la base de datos (DocumentManagementDB)
- `DB_USER_ADMIN`: Usuario administrador de SQL Server (app_admin)
- `DB_PASSWORD_ADMIN`: Contraseña del usuario administrador
- `DB_USER`: Usuario normal de SQL Server (app_user)
- `DB_USER_PASSWORD`: Contraseña del usuario normal
- `JWT_SECRET`: Secret key para la firma de tokens JWT
- Otras variables según la configuración de tu proyecto (Microsoft Auth, Email, etc.)

## Base de Datos

Este proyecto utiliza **SQL Server** con **enmascaramiento de datos (Dynamic Data Masking)** para proteger información sensible. La configuración de la base de datos requiere pasos adicionales que no pueden ser generados automáticamente por Prisma.

### Paso 1: Levantar el contenedor Docker

Para desarrollo, la base de datos SQL Server se ejecuta en un contenedor Docker:

```bash
docker compose up -d
```

Esto levantará un contenedor SQL Server (`security-project-sqlserver`) con la configuración especificada en `docker-compose.yaml`:

- **Puerto**: 1433
- **Usuario SA**: `sa` / `StrongPassword@123`
- **Imagen**: SQL Server 2022 Express

### Paso 2: Inicializar la estructura de la base de datos

⚠️ **IMPORTANTE**: Estos pasos son **obligatorios** para configurar:

- La estructura completa de tablas y relaciones
- El **enmascaramiento de datos** (Dynamic Data Masking)
- Usuarios y permisos personalizados (`app_admin` y `app_user`)
- Triggers para actualización automática de timestamps
- Índices para optimización

Ejecuta los siguientes comandos en orden:

```bash
# 1. Eliminar la base de datos existente (si existe)
docker exec -it security-project-sqlserver /opt/mssql-tools18/bin/sqlcmd \
 -S localhost -U sa -P "StrongPassword@123" -C \
 -Q "DROP DATABASE IF EXISTS DocumentManagementDB"

# 2. Copiar el script de inicialización al contenedor
docker cp init-db/01-init.sql security-project-sqlserver:/tmp/init.sql

# 3. Ejecutar el script de inicialización
docker exec -it security-project-sqlserver /opt/mssql-tools18/bin/sqlcmd \
 -S localhost -U sa -P "StrongPassword@123" -C \
 -i /tmp/init.sql
```

Este script crea:

- Base de datos `DocumentManagementDB`
- Tablas: `users`, `password_reset_tokens`, `documents`, `document_recipients`, `document_attachments`
- Enmascaramiento de datos en campos sensibles
- Usuario `app_admin` (con permisos UNMASK para ver datos reales)
- Usuario `app_user` (ve datos enmascarados)
- Triggers y índices

### Paso 3: Poblar la base de datos con datos iniciales

Para poblar la base de datos con datos de ejemplo:

```bash
pnpm exec prisma db seed
```

### 🔐 Sobre el Enmascaramiento de Datos

El proyecto utiliza **Dynamic Data Masking** de SQL Server para proteger información sensible:

- **Usuario `app_admin`**: Tiene permisos `UNMASK` y puede ver datos reales
- **Usuario `app_user`**: Ve datos enmascarados (ej: `eXXX@XXXX.com` en lugar del email real)

La aplicación utiliza ambos usuarios según el contexto, permitiendo diferentes niveles de seguridad.

## Comandos Disponibles

### Desarrollo

```bash
pnpm dev
```

Inicia el servidor en modo desarrollo con recarga automática.

### Producción

```bash
pnpm build
pnpm prod
```

Compila el proyecto y lo ejecuta en modo producción.

### Otros comandos útiles

```bash
pnpm lint          # Ejecuta el linter y corrige errores
pnpm format        # Formatea el código con Prettier
pnpm start         # Inicia el servidor (sin watch)
pnpm debug         # Inicia el servidor en modo debug
```

## Estructura del Proyecto

- `src/`: Código fuente de la aplicación
- `prisma/`: Esquema y migraciones de Prisma
- `prisma/seed.ts`: Script de semillado de la base de datos
- `docker-compose.yaml`: Configuración de Docker para desarrollo
- `init-db/01-init.sql`: Script SQL para inicializar la base de datos con enmascaramiento

## Notas

- ⚠️ **IMPORTANTE**: Asegúrate de ejecutar los pasos de inicialización de la base de datos (ver sección "Base de Datos") antes de usar la aplicación
- El contenedor de SQL Server debe estar corriendo antes de ejecutar comandos de Prisma
- El archivo `.env` no debe ser commiteado al repositorio (está en `.gitignore`)
- Para detener el contenedor de SQL Server: `docker compose down`
- Para detener y eliminar los datos: `docker compose down -v` (⚠️ esto eliminará todos los datos)
