import { Module } from '@nestjs/common'
import { CoreModule } from './core/core.module'
import { HealthController } from './health.controller'
import { ResponseInterceptor } from './shared/interceptors/response.interceptor'
import { APP_INTERCEPTOR } from '@nestjs/core'

@Module({
  imports: [CoreModule],
  controllers: [HealthController],
  providers: [
    // ResponseInterceptor,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}
