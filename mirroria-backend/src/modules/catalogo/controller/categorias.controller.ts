import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import type { CategoriaResponseDto } from '../dto/catalogo-response.dto.js';
import { CreateCategoriaDto } from '../dto/create-categoria.dto.js';
import { CategoriasService } from '../service/categorias.service.js';

@ApiTags('catalogo/categorias')
@Controller('catalogo/categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  // RF04/RF05: gestionar categorías — ADMIN únicamente. GET queda público (RF07).
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateCategoriaDto): Promise<CategoriaResponseDto> {
    return this.categoriasService.create(dto);
  }

  @Get()
  findAll(): Promise<CategoriaResponseDto[]> {
    return this.categoriasService.findAll();
  }
}
