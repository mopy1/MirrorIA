import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { SinTenant } from '../../../core/tenancy/sin-tenant.decorator.js';
import { CreateCiudadDto } from '../dto/create-ciudad.dto.js';
import type { CiudadResponseDto } from '../dto/sucursales-response.dto.js';
import { CiudadesService } from '../service/ciudades.service.js';

// Ciudades globales (Fase 1 SaaS): sin tienda. Crear es de la plataforma.
@ApiTags('sucursales/ciudades')
@SinTenant()
@Controller('sucursales/ciudades')
export class CiudadesController {
  constructor(private readonly ciudadesService: CiudadesService) {}

  // RF03: administrar ciudades — solo DUENO_PLATAFORMA (son de todas las
  // tiendas). GET queda público (selector de ciudad al crear una sucursal).
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DUENO_PLATAFORMA')
  create(@Body() dto: CreateCiudadDto): Promise<CiudadResponseDto> {
    return this.ciudadesService.create(dto);
  }

  @Get()
  findAll(): Promise<CiudadResponseDto[]> {
    return this.ciudadesService.findAll();
  }
}
