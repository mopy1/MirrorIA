import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IaController } from './controller/ia.controller.js';
import { InteraccionIa } from './entities/interaccion-ia.entity.js';
import { IaService } from './service/ia.service.js';
import { MotorConsultaService } from './service/motor-consulta.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InteraccionIa])],
  controllers: [IaController],
  providers: [IaService, MotorConsultaService],
})
export class IaModule {}
