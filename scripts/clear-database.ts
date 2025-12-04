/**
 * Script para limpiar la base de datos
 * Elimina todos los usuarios (útil para desarrollo)
 *
 * Uso: tsx scripts/clear-database.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { users } from '../src/database/schema';
import { eq } from 'drizzle-orm';

config();

async function clearDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no está configurado en .env');
    process.exit(1);
  }

  console.log('🔌 Conectando a la base de datos...');
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    // Contar usuarios antes
    const countBefore = await db.select().from(users);
    console.log(`📊 Usuarios encontrados: ${countBefore.length}`);

    if (countBefore.length === 0) {
      console.log('✅ La base de datos ya está vacía');
      await client.end();
      return;
    }

    // Mostrar usuarios que se van a eliminar
    console.log('\n👥 Usuarios que se eliminarán:');
    countBefore.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.name}) - ID: ${user.id}`);
    });

    // Eliminar todos los usuarios
    console.log('\n🗑️  Eliminando usuarios...');
    await db.delete(users);

    // Verificar
    const countAfter = await db.select().from(users);
    console.log(`✅ Usuarios restantes: ${countAfter.length}`);

    if (countAfter.length === 0) {
      console.log('✨ Base de datos limpiada exitosamente');
    } else {
      console.log('⚠️  Algo salió mal, aún hay usuarios');
    }
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

clearDatabase();


