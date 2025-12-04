/**
 * Script para ejecutar migraciones SQL manuales
 *
 * Uso: tsx scripts/run-migration.ts <nombre-archivo.sql>
 * Ejemplo: tsx scripts/run-migration.ts 0001_create_admin_user.sql
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

config();

async function runMigration() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('❌ Debes especificar el archivo de migración');
    console.error('Uso: tsx scripts/run-migration.ts <archivo.sql>');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no está configurado en .env');
    process.exit(1);
  }

  const migrationPath = join(process.cwd(), 'src/database/migrations', migrationFile);

  try {
    console.log(`📄 Leyendo migración: ${migrationFile}`);
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('🔌 Conectando a la base de datos...');
    const client = postgres(databaseUrl);

    console.log('🚀 Ejecutando migración...');
    await client.unsafe(sql);

    console.log('✅ Migración ejecutada exitosamente');

    await client.end();
  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error);
    process.exit(1);
  }
}

runMigration();
