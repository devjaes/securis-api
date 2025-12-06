import { Global, Module } from '@nestjs/common'
import { DBService } from './database/database.service'
import { CustomConfigService } from './config/config.service'
import { ConfigModule } from '@nestjs/config'
import { config, configValidationSchema } from './config/constants'

@Global()
@Module({
  providers: [DBService, CustomConfigService],
  exports: [DBService, CustomConfigService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: configValidationSchema,
      load: [config],
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
  ],
})
export class CoreModule {}
