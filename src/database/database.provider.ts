import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ConfigService } from '@nestjs/config';

export const createDatabaseConnection = (configService: ConfigService) => {
  const databaseUrl = configService.get<string>('database.url')!;

  const client = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client);
};

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
