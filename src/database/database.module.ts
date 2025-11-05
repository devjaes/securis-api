import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createDatabaseConnection,
  DATABASE_CONNECTION,
} from './database.provider';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: ConfigService) =>
        createDatabaseConnection(configService),
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
