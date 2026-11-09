import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { JwtOpcionalGuard } from '../../../core/security/jwt-opcional.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
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

  // ?conVariantes=true: el catálogo con sus variantes en una sola consulta
  // (espejo offline de la app móvil, H1). Sin el parámetro, como siempre.
  @Get()
  @ApiQuery({ name: 'conVariantes', required: false, type: Boolean })
  findAll(@Query('conVariantes') conVariantes?: string): Promise<ProductoResponseDto[]> {
    return this.productosService.findAll(conVariantes === 'true');
  }

  // Público, pero un producto inactivo solo lo ve el ADMIN (el resto: 404).
  @Get(':id')
  @UseGuards(JwtOpcionalGuard)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<ProductoResponseDto> {
    return this.productosService.findOne(id, user?.role === 'ADMIN');
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
