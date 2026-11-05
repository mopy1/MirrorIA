import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { SinTenant } from '../../../core/tenancy/sin-tenant.decorator.js';
import { CambiarEstadoInquilinoDto } from '../dto/cambiar-estado-inquilino.dto.js';
import { CambiarPlanDto } from '../dto/cambiar-plan.dto.js';
import { ActualizarPlanDto, CrearPlanDto } from '../dto/crear-plan.dto.js';
import { ExtenderDto } from '../dto/extender.dto.js';
import { FiltroInquilinosDto, type InquilinoDetalleDto, type InquilinoResumenDto } from '../dto/inquilino.dto.js';
import type { PlanDto } from '../dto/plan.dto.js';
import type { ResumenPlataformaDto } from '../dto/resumen-plataforma.dto.js';
import { InquilinosService } from '../service/inquilinos.service.js';
import { PlanesService } from '../service/planes.service.js';

// Panel del DUENO_PLATAFORMA: tiendas y planes. No ve datos de negocio (solo conteos).
@ApiTags('saas/plataforma')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DUENO_PLATAFORMA')
@SinTenant()
@Controller('saas/plataforma')
export class PlataformaController {
  constructor(
    private readonly inquilinos: InquilinosService,
    private readonly planes: PlanesService,
  ) {}

  @Get('resumen')
  resumen(): Promise<ResumenPlataformaDto> {
    return this.inquilinos.resumen();
  }

  @Get('inquilinos')
  listar(@Query() filtro: FiltroInquilinosDto): Promise<InquilinoResumenDto[]> {
    return this.inquilinos.listar(filtro);
  }

  @Get('inquilinos/:id')
  detalle(@Param('id') id: string): Promise<InquilinoDetalleDto> {
    return this.inquilinos.detalle(id);
  }

  @Patch('inquilinos/:id/estado')
  cambiarEstado(
    @Param('id') id: string, @Body() dto: CambiarEstadoInquilinoDto, @CurrentUser() user: JwtPayload,
  ): Promise<InquilinoDetalleDto> {
    return this.inquilinos.cambiarEstado(id, dto, user.sub);
  }

  @Patch('inquilinos/:id/plan')
  cambiarPlan(
    @Param('id') id: string, @Body() dto: CambiarPlanDto, @CurrentUser() user: JwtPayload,
  ): Promise<InquilinoDetalleDto> {
    return this.inquilinos.cambiarPlan(id, dto.planCodigo, user.sub);
  }

  @Post('inquilinos/:id/extender')
  @HttpCode(HttpStatus.OK)
  extender(
    @Param('id') id: string, @Body() dto: ExtenderDto, @CurrentUser() user: JwtPayload,
  ): Promise<InquilinoDetalleDto> {
    return this.inquilinos.extender(id, dto.dias, user.sub);
  }

  @Get('planes')
  listarPlanes(): Promise<PlanDto[]> {
    return this.planes.listar(false);
  }

  @Post('planes')
  @HttpCode(HttpStatus.CREATED)
  crearPlan(@Body() dto: CrearPlanDto): Promise<PlanDto> {
    return this.planes.crear(dto);
  }

  @Patch('planes/:id')
  actualizarPlan(@Param('id') id: string, @Body() dto: ActualizarPlanDto): Promise<PlanDto> {
    return this.planes.actualizar(id, dto);
  }
}
