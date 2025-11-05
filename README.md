# Securis API

Backend API for secure document management system with multi-layer Huffman encryption.

## Features

- 🔐 Multi-layer encryption (Frontend → Backend → Database)
- 🔑 Microsoft Authentication integration
- 📄 Document management (Oficios & Memorandos)
- ✍️ Electronic signatures with QR codes
- 🗄️ PostgreSQL with Drizzle ORM
- 🔒 SSL/HTTPS support

## Tech Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL 16
- **ORM:** Drizzle
- **Authentication:** Passport JWT + Microsoft MSAL
- **Encryption:** Custom Huffman implementation
- **Runtime:** Node.js 20 LTS

## Getting Started

### Prerequisites

- Node.js 20.x LTS
- pnpm 9.x
- PostgreSQL 16
- Docker (optional, recommended)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Database Setup

```bash
# Generate migration
pnpm db:generate

# Run migration
pnpm db:migrate

# Or push schema directly (dev only)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

### Running the Application

```bash
# Development
pnpm start:dev

# Production build
pnpm build
pnpm start:prod
```

The API will be available at: `http://localhost:3000/api`

## Project Structure

```
src/
├── config/              # Configuration files
├── database/            # Database connection and schemas
│   ├── schema/         # Drizzle schemas
│   └── migrations/     # Database migrations
├── modules/            # Feature modules
├── common/             # Shared utilities
└── main.ts             # Application entry point
```

## Environment Variables

See `.env.example` for all required environment variables.

## Scripts

- `pnpm start:dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run migrations
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Drizzle Studio

## License

MIT License - Copyright (c) 2025 devjaes
# securis-api
