import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { CreateCiudadDto } from '../dto/create-ciudad.dto.js';
import type { CiudadResponseDto } from '../dto/sucursales-response.dto.js';
import { CiudadesService } from '../service/ciudades.service.js';

@ApiTags('sucursales/ciudades')
@Controller('sucursales/ciudades')
export class CiudadesController {
  constructor(private readonly ciudadesService: CiudadesService) {}

  // RF03: administrar ciudades — ADMIN únicamente. GET queda público (lo
  // consume el selector de ciudad al crear una sucursal, y potencialmente
  // filtros del storefront).
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateCiudadDto): Promise<CiudadResponseDto> {
    return this.ciudadesService.create(dto);
  }

  @Get()
  findAll(): Promise<CiudadResponseDto[]> {
    return this.ciudadesService.findAll();
  }
}
