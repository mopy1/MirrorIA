import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { SinTenant } from './core/tenancy/sin-tenant.decorator.js';

@SinTenant()
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth(): { status: string; service: string } {
    return this.appService.getHealth();
  }
}
