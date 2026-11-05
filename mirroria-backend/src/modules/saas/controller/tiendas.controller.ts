import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SolicitudInvalidaException } from '../../../core/exception/solicitud-invalida.exception.js';
import { LimitePorIp } from '../../../core/security/limite-por-ip.js';
import { PermitirTiendaNoDisponible } from '../../../core/tenancy/permitir-tienda-no-disponible.decorator.js';
import { SinTenant } from '../../../core/tenancy/sin-tenant.decorator.js';
import type { DisponibilidadSlugDto } from '../dto/disponibilidad-slug.dto.js';
import { FiltroTiendasDto } from '../dto/filtro-tiendas.dto.js';
import { RegistrarTiendaDto } from '../dto/registrar-tienda.dto.js';
import type { RegistroTiendaResponse } from '../dto/registro-tienda-response.dto.js';
import type { TiendaPublicaDto } from '../dto/tienda-publica.dto.js';
import { AprovisionamientoService } from '../service/aprovisionamiento.service.js';
import { TiendasPublicasService } from '../service/tiendas-publicas.service.js';

// Públicas: directorio, chequeo del slug, resolver una tienda y crear la propia.
@ApiTags('saas/tiendas')
@SinTenant()
@PermitirTiendaNoDisponible()
@Controller('saas/tiendas')
export class TiendasController {
  constructor(
    private readonly tiendas: TiendasPublicasService,
    private readonly aprovisionamiento: AprovisionamientoService,
  ) {}

  @Get()
  listar(@Query() filtro: FiltroTiendasDto): Promise<TiendaPublicaDto[]> {
    return this.tiendas.tiendasPublicas(filtro.limite ?? 12);
  }

  @Get('disponibilidad')
  disponibilidad(@Query('slug') slug?: string): Promise<DisponibilidadSlugDto> {
    if (!slug?.trim()) throw new SolicitudInvalidaException('Falta el parámetro slug');
    return this.tiendas.disponibilidad(slug);
  }

  @Get(':slug')
  ver(@Param('slug') slug: string): Promise<TiendaPublicaDto> {
    return this.tiendas.tiendaPublica(slug);
  }

  // Alta de tienda en una transacción; devuelve el JWT del ADMIN. 5 por hora por IP.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LimitePorIp(5, 60 * 60 * 1000))
  registrar(@Body() dto: RegistrarTiendaDto): Promise<RegistroTiendaResponse> {
    return this.aprovisionamiento.registrar(dto);
  }
}
