import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { assertOwnUser } from '../../../core/security/assert-own-user.js';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { CheckoutCarritoDto } from '../dto/checkout-carrito.dto.js';
import { CreateVentaPresencialDto } from '../dto/create-venta-presencial.dto.js';
import type { VentaResponseDto } from '../dto/ventas-response.dto.js';
import { VentasService } from '../service/ventas.service.js';

@ApiTags('ventas')
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  // RF17/RF18: el cajero registra la venta después de que el cliente se
  // prueba las prendas y decide qué comprar. cajeroId sale del token, no del
  // body — evita que alguien registre una venta "como" otro cajero.
  @Post('presenciales')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO')
  registrarPresencial(
    @Body() dto: CreateVentaPresencialDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<VentaResponseDto> {
    return this.ventasService.registrarPresencial(dto, user.sub);
  }

  // RF15/RF16: compra digital desde web o móvil, a partir del carrito activo.
  // Cualquier usuario autenticado puede comprar, pero solo el dueño del
  // carrito — CarritosController/VentasController comparten el mismo criterio
  // de "usuarioId de la URL debe ser el mismo del token", ver carritos.controller.ts.
  @Post('carrito/:usuarioId/checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  checkout(
    @Param('usuarioId') usuarioId: string,
    @Body() dto: CheckoutCarritoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<VentaResponseDto> {
    assertOwnUser(usuarioId, user);
    return this.ventasService.checkoutCarrito(usuarioId, dto);
  }

  // Consulta de ventas: dato interno (RF24 — reportes), no del cliente final.
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  findAll(@Query('sucursalId') sucursalId?: string): Promise<VentaResponseDto[]> {
    return this.ventasService.findAll({ sucursalId });
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  findOne(@Param('id') id: string): Promise<VentaResponseDto> {
    return this.ventasService.findOne(id);
  }
}
