import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import type { ColorResponseDto } from '../dto/catalogo-response.dto.js';
import { CreateColorDto } from '../dto/create-color.dto.js';
import { ColoresService } from '../service/colores.service.js';

@ApiTags('catalogo/colores')
@Controller('catalogo/colores')
export class ColoresController {
  constructor(private readonly coloresService: ColoresService) {}

  // RF05: gestionar colores — ADMIN únicamente. GET queda público.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateColorDto): Promise<ColorResponseDto> {
    return this.coloresService.create(dto);
  }

  @Get()
  findAll(): Promise<ColorResponseDto[]> {
    return this.coloresService.findAll();
  }
}
