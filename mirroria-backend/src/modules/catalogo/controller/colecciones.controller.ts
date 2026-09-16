import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import type { ColeccionResponseDto } from '../dto/catalogo-response.dto.js';
import { CreateColeccionDto } from '../dto/create-coleccion.dto.js';
import { ColeccionesService } from '../service/colecciones.service.js';

@ApiTags('catalogo/colecciones')
@Controller('catalogo/colecciones')
export class ColeccionesController {
  constructor(private readonly coleccionesService: ColeccionesService) {}

  // RF23: gestionar colecciones — ADMIN únicamente. GET queda público.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateColeccionDto): Promise<ColeccionResponseDto> {
    return this.coleccionesService.create(dto);
  }

  @Get()
  findAll(): Promise<ColeccionResponseDto[]> {
    return this.coleccionesService.findAll();
  }
}
