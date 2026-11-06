import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Idempotencia } from './entities/idempotencia.entity.js';
import { IdempotenciaInterceptor } from './idempotencia.interceptor.js';
import { IdempotenciaService } from './idempotencia.service.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Idempotencia])],
  providers: [
    IdempotenciaService,
    IdempotenciaInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotenciaInterceptor,
    },
  ],
  exports: [IdempotenciaService, IdempotenciaInterceptor, TypeOrmModule],
})
export class IdempotenciaModule {}
