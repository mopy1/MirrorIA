import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { PermitirTiendaNoDisponible } from '../../../core/tenancy/permitir-tienda-no-disponible.decorator.js';
import { tenantActual } from '../../../core/tenancy/tenant-context.js';
import { CambiarPlanDto } from '../dto/cambiar-plan.dto.js';
import {
  CobroSuscripcionResponseDto,
  EstadoCobroSuscripcionResponseDto,
} from '../dto/cobro-suscripcion-response.dto.js';
import { IniciarCobroSuscripcionDto } from '../dto/iniciar-cobro-suscripcion.dto.js';
import type { MiSuscripcionDto } from '../dto/mi-suscripcion.dto.js';
import { CobrosSuscripcionService } from '../service/cobros-suscripcion.service.js';
import { MiSuscripcionService } from '../service/mi-suscripcion.service.js';

// El dueño de la tienda (ADMIN) ve su plan y puede pagar aunque la tienda esté vencida o suspendida.
@ApiTags('saas/mi-suscripcion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@PermitirTiendaNoDisponible()
@Controller('saas/mi-suscripcion')
export class MiSuscripcionController {
  constructor(
    private readonly miSuscripcion: MiSuscripcionService,
    private readonly cobrosSuscripcion: CobrosSuscripcionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Ver estado de suscripción, plan y consumo' })
  ver(): Promise<MiSuscripcionDto> {
    return this.miSuscripcion.ver(tenantActual());
  }

  /** Solo en TRIAL (con cobro llega en la Fase 2). */
  @Patch('plan')
  @ApiOperation({ summary: 'Cambiar de plan (solo en periodo TRIAL)' })
  cambiarPlan(@Body() dto: CambiarPlanDto, @CurrentUser() user: JwtPayload): Promise<MiSuscripcionDto> {
    return this.miSuscripcion.cambiarPlan(tenantActual(), dto.planCodigo, user.sub);
  }

  @Post('cobro')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar cobro de suscripción SaaS con pasarela enchufable' })
  iniciarCobro(
    @Body() dto: IniciarCobroSuscripcionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<CobroSuscripcionResponseDto> {
    const urlOrigen = req.get('origin') ?? req.get('referer');
    return this.cobrosSuscripcion.iniciarCobro(tenantActual(), dto, user.email, urlOrigen);
  }

  @Get('cobro/:cobroId/estado')
  @ApiOperation({ summary: 'Consultar estado del cobro de suscripción (polling QR)' })
  consultarEstadoCobro(
    @Param('cobroId') cobroId: string,
  ): Promise<EstadoCobroSuscripcionResponseDto> {
    return this.cobrosSuscripcion.obtenerEstado(tenantActual(), cobroId);
  }

  @Post('cobro/:cobroId/simular-pago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simular pago de suscripción para desarrollo' })
  simularPago(
    @Param('cobroId') cobroId: string,
  ): Promise<EstadoCobroSuscripcionResponseDto> {
    return this.cobrosSuscripcion.simularPago(tenantActual(), cobroId);
  }
}
