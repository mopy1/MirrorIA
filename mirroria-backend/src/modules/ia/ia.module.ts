import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IaController } from './controller/ia.controller.js';
import { InteraccionIa } from './entities/interaccion-ia.entity.js';
import { DeepSeekProveedor } from './service/proveedor-ia/deepseek.proveedor.js';
import { PROVEEDOR_IA } from './service/proveedor-ia/proveedor-ia.interface.js';
import { IaService } from './service/ia.service.js';
import { MotorConsultaService } from './service/motor-consulta.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InteraccionIa])],
  controllers: [IaController],
  providers: [
    IaService,
    MotorConsultaService,
    { provide: PROVEEDOR_IA, useClass: DeepSeekProveedor },
  ],
})
export class IaModule {}
