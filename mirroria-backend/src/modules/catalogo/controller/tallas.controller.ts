import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import type { TallaResponseDto } from '../dto/catalogo-response.dto.js';
import { CreateTallaDto } from '../dto/create-talla.dto.js';
import { TallasService } from '../service/tallas.service.js';

@ApiTags('catalogo/tallas')
@Controller('catalogo/tallas')
export class TallasController {
  constructor(private readonly tallasService: TallasService) {}

  // RF05: gestionar tallas — ADMIN únicamente. GET queda público.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateTallaDto): Promise<TallaResponseDto> {
    return this.tallasService.create(dto);
  }

  @Get()
  findAll(): Promise<TallaResponseDto[]> {
    return this.tallasService.findAll();
  }
}
