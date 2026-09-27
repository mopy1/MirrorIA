import { Module } from '@nestjs/common';
import { ProbadorController } from './controller/probador.controller.js';
import { ProbadorService } from './service/probador.service.js';

@Module({
  controllers: [ProbadorController],
  providers: [ProbadorService],
})
export class ProbadorModule {}
