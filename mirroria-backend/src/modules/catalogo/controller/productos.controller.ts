import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import type {
  ProductoResponseDto,
  VarianteResponseDto,
} from '../dto/catalogo-response.dto.js';
import { CreateProductoDto } from '../dto/create-producto.dto.js';
import { CreateVarianteDto } from '../dto/create-variante.dto.js';
import { UpdateProductoDto } from '../dto/update-producto.dto.js';
import { ProductosService } from '../service/productos.service.js';

// GET son públicos a propósito (RF07: el cliente consulta el catálogo sin
// necesitar sesión). Los POST (gestionar productos, RF04) quedan detrás de ADMIN.
@ApiTags('catalogo/productos')
@Controller('catalogo/productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateProductoDto): Promise<ProductoResponseDto> {
    return this.productosService.create(dto);
  }

  @Get()
  findAll(): Promise<ProductoResponseDto[]> {
    return this.productosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductoResponseDto> {
    return this.productosService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductoDto,
  ): Promise<ProductoResponseDto> {
    return this.productosService.update(id, dto);
  }

  @Post(':id/variantes')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createVariante(
    @Param('id') id: string,
    @Body() dto: CreateVarianteDto,
  ): Promise<VarianteResponseDto> {
    return this.productosService.createVariante(id, dto);
  }
}
