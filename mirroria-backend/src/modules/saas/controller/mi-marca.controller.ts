import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { PermitirTiendaNoDisponible } from '../../../core/tenancy/permitir-tienda-no-disponible.decorator.js';
import { contextoTenant, tenantActual } from '../../../core/tenancy/tenant-context.js';
import { ActualizarMarcaDto, type MiMarcaDto, RestablecerMarcaDto } from '../dto/marca.dto.js';
import { MarcaService } from '../service/marca.service.js';

// La dueña (ADMIN) personaliza SU tienda: la tienda sale del JWT, nunca de la ruta.
@ApiTags('saas/mi-marca')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('saas/mi-marca')
export class MiMarcaController {
  constructor(private readonly marca: MarcaService) {}

  @Get()
  @PermitirTiendaNoDisponible()
  ver(): Promise<MiMarcaDto> {
    return this.marca.miMarca(tenantActual());
  }

  @Put()
  guardar(@Body() dto: ActualizarMarcaDto, @CurrentUser() user: JwtPayload): Promise<MiMarcaDto> {
    return this.marca.guardar(tenantActual(), dto, user.sub);
  }

  @Post('restablecer')
  @HttpCode(HttpStatus.OK)
  async restablecer(@Body() dto: RestablecerMarcaDto, @CurrentUser() user: JwtPayload): Promise<MiMarcaDto> {
    const tenantId = tenantActual();
    await this.marca.restablecer(tenantId, contextoTenant()?.nombre ?? '', dto.seccion, { id: user.sub, rol: 'TIENDA' });
    return this.marca.miMarca(tenantId);
  }
}
