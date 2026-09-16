import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { assertOwnUser } from '../../../core/security/assert-own-user.js';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { AddItemCarritoDto } from '../dto/add-item-carrito.dto.js';
import type { CarritoResponseDto } from '../dto/ventas-response.dto.js';
import { CarritosService } from '../service/carritos.service.js';

// El carrito es siempre "el mío" — cualquier usuario autenticado puede tener
// uno, pero solo puede tocar el suyo (assertOwnUser compara contra el token).
@ApiTags('ventas/carrito')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ventas/carrito')
export class CarritosController {
  constructor(private readonly carritosService: CarritosService) {}

  @Get(':usuarioId')
  getCarrito(
    @Param('usuarioId') usuarioId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CarritoResponseDto> {
    assertOwnUser(usuarioId, user);
    return this.carritosService.getCarrito(usuarioId);
  }

  @Post(':usuarioId/items')
  addItem(
    @Param('usuarioId') usuarioId: string,
    @Body() dto: AddItemCarritoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CarritoResponseDto> {
    assertOwnUser(usuarioId, user);
    return this.carritosService.addItem(usuarioId, dto);
  }

  @Delete(':usuarioId/items/:varianteId')
  removeItem(
    @Param('usuarioId') usuarioId: string,
    @Param('varianteId') varianteId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CarritoResponseDto> {
    assertOwnUser(usuarioId, user);
    return this.carritosService.removeItem(usuarioId, varianteId);
  }
}
