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
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { CreateOrdenCompraDto } from '../dto/create-orden-compra.dto.js';
import type { OrdenCompraResponseDto } from '../dto/inventario-response.dto.js';
import { RecibirOrdenCompraDto } from '../dto/recibir-orden-compra.dto.js';
import { OrdenesCompraService } from '../service/ordenes-compra.service.js';

// Reabastecimiento con proveedores — ADMIN únicamente (el encargado registra
// movimientos puntuales, pero no negocia/gestiona órdenes de compra).
@ApiTags('inventario/ordenes-compra')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('inventario/ordenes-compra')
export class OrdenesCompraController {
  constructor(private readonly ordenesCompraService: OrdenesCompraService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateOrdenCompraDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrdenCompraResponseDto> {
    return this.ordenesCompraService.create({
      ...dto,
      usuarioId: dto.usuarioId || user.sub,
    });
  }

  @Get()
  findAll(): Promise<OrdenCompraResponseDto[]> {
    return this.ordenesCompraService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<OrdenCompraResponseDto> {
    return this.ordenesCompraService.findOneResponse(id);
  }

  @Patch(':id/recibir')
  recibir(
    @Param('id') id: string,
    @Body() dto: RecibirOrdenCompraDto,
  ): Promise<OrdenCompraResponseDto> {
    return this.ordenesCompraService.recibir(id, dto);
  }
}
