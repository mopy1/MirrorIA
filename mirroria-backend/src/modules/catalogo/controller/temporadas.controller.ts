import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import type { TemporadaResponseDto } from '../dto/catalogo-response.dto.js';
import { CreateTemporadaDto } from '../dto/create-temporada.dto.js';
import { TemporadasService } from '../service/temporadas.service.js';

@ApiTags('catalogo/temporadas')
@Controller('catalogo/temporadas')
export class TemporadasController {
  constructor(private readonly temporadasService: TemporadasService) {}

  // RF23: gestionar temporadas — ADMIN únicamente. GET queda público.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateTemporadaDto): Promise<TemporadaResponseDto> {
    return this.temporadasService.create(dto);
  }

  @Get()
  findAll(): Promise<TemporadaResponseDto[]> {
    return this.temporadasService.findAll();
  }
}
