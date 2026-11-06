import { Module } from '@nestjs/common';
import { SaasModule } from '../saas/saas.module.js';
import { DashboardController } from './controller/dashboard.controller.js';
import { PeriodosService } from './service/periodos.service.js';
import { DashboardEjecutivoService } from './service/dashboard-ejecutivo.service.js';
import { DashboardOperativoService } from './service/dashboard-operativo.service.js';

@Module({
  imports: [SaasModule],
  controllers: [DashboardController],
  providers: [
    PeriodosService,
    DashboardEjecutivoService,
    DashboardOperativoService,
  ],
  exports: [
    PeriodosService,
    DashboardEjecutivoService,
    DashboardOperativoService,
  ],
})
export class BiModule {}
