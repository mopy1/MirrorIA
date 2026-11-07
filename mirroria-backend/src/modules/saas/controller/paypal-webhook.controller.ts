import { Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SinTenant } from '../../../core/tenancy/sin-tenant.decorator.js';
import { CobrosSuscripcionService } from '../service/cobros-suscripcion.service.js';

// Sin guard a proposito: PayPal no puede mandar un JWT. La firma es la unica
// defensa, y la tienda sale de la fila del cobro.
@ApiTags('saas/webhooks')
@SinTenant()
@Controller('saas/webhooks')
export class PaypalWebhookController {
  constructor(private readonly cobrosSuscripcion: CobrosSuscripcionService) {}

  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de PayPal (público, verificado por firma)' })
  procesar(
    @Req() req: RawBodyRequest<Request>,
    @Headers() cabeceras: Record<string, string>,
  ): Promise<{ procesado: boolean }> {
    return this.cobrosSuscripcion.procesarAvisoPaypal(req.rawBody ?? Buffer.alloc(0), cabeceras);
  }
}
