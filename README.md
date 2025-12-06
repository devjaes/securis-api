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
- `DB_URL`: URL de conexión a la base de datos PostgreSQL
- `JWT_SECRET`: Secret key para la firma de tokens JWT
- `DB_PORT`: Puerto de PostgreSQL (usado por Docker Compose)
- `DB_USER`: Usuario de PostgreSQL
- `DB_PASSWORD`: Contraseña de PostgreSQL
- `DB_NAME`: Nombre de la base de datos

## Base de Datos

### Levantar la base de datos con Docker

Para desarrollo, la base de datos PostgreSQL se ejecuta en un contenedor Docker:

```bash
docker compose up -d
```

Esto levantará un contenedor PostgreSQL con la configuración especificada en `docker-compose.yaml`.

### Configurar la base de datos con Prisma

Una vez que la base de datos esté corriendo, genera el esquema y aplica los cambios:

```bash
pnpm exec prisma db push
```

Este comando sincronizará el esquema de Prisma con la base de datos sin crear migraciones.

### Semillar la base de datos

Para poblar la base de datos con datos de ejemplo:

```bash
pnpm exec prisma db seed
```

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

## Notas

- Asegúrate de que el contenedor de PostgreSQL esté corriendo antes de ejecutar comandos de Prisma
- El archivo `.env` no debe ser commiteado al repositorio (está en `.gitignore`)
- Para detener el contenedor de PostgreSQL: `docker-compose down`
