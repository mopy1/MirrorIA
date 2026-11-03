import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import {
  CobroQrResponseDto,
  EstadoCobroQrResponseDto,
} from '../dto/cobro-qr-response.dto.js';
import { IniciarPagoDto } from '../dto/iniciar-pago.dto.js';
import { InstruccionesResponseDto } from '../dto/instrucciones-response.dto.js';
import { PagoResponseDto } from '../dto/pago-response.dto.js';
import { ExpiracionService } from '../service/expiracion.service.js';
import { PagosService } from '../service/pagos.service.js';
import { CobroQrService } from '../service/qr/cobro-qr.service.js';

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
  constructor(
    private readonly pagosService: PagosService,
    private readonly expiracionService: ExpiracionService,
    private readonly cobroQrService: CobroQrService,
  ) {}

  @Post('ventas/:ventaId/qr')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Generar el QR de cobro de una venta propia (se acredita solo al pagarlo)',
  })
  iniciarQr(
    @Param('ventaId') ventaId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CobroQrResponseDto> {
    return this.cobroQrService.iniciar(ventaId, user);
  }

  @Get('qr/:pagoId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Estado de un cobro por QR propio (la tienda lo consulta mientras espera)',
  })
  estadoQr(
    @Param('pagoId') pagoId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<EstadoCobroQrResponseDto> {
    return this.cobroQrService.estadoParaLaClienta(pagoId, user);
  }

  @Post('qr/aviso')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Aviso de pago del banco por QR (público, verificado por firma HMAC)',
  })
  avisoQr(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-wayra-firma') firma: string,
  ): Promise<{ procesado: boolean }> {
    // Sin guard, como el webhook de Stripe: el banco no tiene JWT, la firma es
    // la unica defensa.
    return this.cobroQrService.procesarAviso(
      req.rawBody ?? Buffer.alloc(0),
      firma ?? '',
    );
  }

  @Post('ventas/:ventaId/manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Iniciar un cobro por QR o efectivo sobre una venta propia',
  })
  iniciarManual(
    @Param('ventaId') ventaId: string,
    @Body() dto: IniciarPagoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<InstruccionesResponseDto> {
    return this.pagosService.iniciarManual(ventaId, dto, user);
  }

  @Post('ventas/:ventaId/sesion')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Iniciar un cobro con tarjeta sobre una venta propia (sesion alojada de Stripe)',
  })
  iniciarTarjeta(
    @Param('ventaId') ventaId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ url: string }> {
    return this.pagosService.iniciarTarjeta(ventaId, user);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de la pasarela (público, verificado por firma)',
  })
  procesarWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') firma: string,
  ): Promise<{ procesado: boolean }> {
    // Sin guard a proposito: la pasarela no puede mandar un JWT. La firma es la
    // unica defensa, y por eso se verifica contra el cuerpo crudo.
    return this.pagosService.procesarEvento(
      req.rawBody ?? Buffer.alloc(0),
      firma ?? '',
    );
  }

  @Post(':pagoId/confirmar')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO')
  @ApiOperation({ summary: 'Confirmar que el dinero de un cobro manual llegó' })
  confirmar(
    @Param('pagoId') pagoId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PagoResponseDto> {
    return this.pagosService.confirmarManual(pagoId, user);
  }

  @Get('pendientes')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO')
  @ApiOperation({ summary: 'Cobros manuales esperando confirmación' })
  pendientes(): Promise<PagoResponseDto[]> {
    return this.pagosService.pendientes();
  }

  @Post('expirar-vencidas')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Liberar el stock de las compras vencidas sin pagar',
  })
  async expirar(): Promise<{ canceladas: number }> {
    return { canceladas: await this.expiracionService.expirarVencidas() };
  }
}
