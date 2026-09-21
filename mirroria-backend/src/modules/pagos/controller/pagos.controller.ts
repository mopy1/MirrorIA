import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { IniciarPagoDto } from '../dto/iniciar-pago.dto.js';
import { InstruccionesResponseDto } from '../dto/instrucciones-response.dto.js';
import { PagoResponseDto } from '../dto/pago-response.dto.js';
import { PagosService } from '../service/pagos.service.js';

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('ventas/:ventaId/manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Iniciar un cobro por QR o efectivo sobre una venta propia' })
  iniciarManual(
    @Param('ventaId') ventaId: string,
    @Body() dto: IniciarPagoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<InstruccionesResponseDto> {
    return this.pagosService.iniciarManual(ventaId, dto, user);
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
}
