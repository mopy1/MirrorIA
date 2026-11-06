import { Module } from '@nestjs/common';
import { MlController } from './controller/ml.controller.js';
import { MlService } from './service/ml.service.js';

@Module({
  controllers: [MlController],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
