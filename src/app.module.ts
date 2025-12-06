import { Module } from '@nestjs/common'
import { CoreModule } from './core/core.module'
import { HealthController } from './health.controller'
import { AuthModule } from './features/auth/auth.module'

@Module({
  imports: [CoreModule, AuthModule],
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
