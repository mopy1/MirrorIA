import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { assertOwnUser } from '../../../core/security/assert-own-user.js';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { sucursalDelStaff } from '../../../core/security/sucursal-del-staff.js';
import { ForbiddenActionException } from '../../../core/exception/forbidden-action.exception.js';
import { CheckoutCarritoDto } from '../dto/checkout-carrito.dto.js';
import { ComprarReservaDto } from '../dto/comprar-reserva.dto.js';
import type { VentaResponseDto } from '../dto/ventas-response.dto.js';
import { VentasService } from '../service/ventas.service.js';

@ApiTags('ventas')
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

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
    @Headers('idempotency-key') clave?: string,
  ): Promise<VentaResponseDto> {
    assertOwnUser(usuarioId, user);
    return this.ventasService.checkoutCarrito(usuarioId, dto, clave);
  }

  // Compra desde la reserva: la clienta, ya EN_TIENDA, compra lo que reservó.
  // Venta PENDIENTE que se paga como el checkout; al aprobarse el pago la
  // reserva pasa a COMPLETADA. La dueña sale del token.
  @Post('desde-reserva/:reservaId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Comprar lo reservado (reserva propia EN_TIENDA): venta PENDIENTE que se paga en caja (efectivo), con Stripe o QR Wayra',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  comprarReserva(
    @Param('reservaId', ParseUUIDPipe) reservaId: string,
    @Body() dto: ComprarReservaDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<VentaResponseDto> {
    return this.ventasService.comprarReserva(reservaId, user.sub, dto);
  }

  // Consulta de ventas: dato interno (RF24 — reportes), no del cliente final.
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('sucursalId') sucursalId?: string,
  ): Promise<VentaResponseDto[]> {
    // Igual que GET /reservas: el encargado solo ve su sucursal (la del JWT manda).
    return this.ventasService.findAll({ sucursalId: sucursalDelStaff(user) ?? sucursalId });
  }

  // "Mis Pedidos & Compras" del perfil — mismo patrón que GET /reservas/mias.
  // Declarado antes de GET :id a propósito: si fuera después, Nest matchearía
  // "mias" contra el parámetro :id en vez de contra esta ruta literal.
  @Get('mias')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  misVentas(@CurrentUser() user: JwtPayload): Promise<VentaResponseDto[]> {
    return this.ventasService.findAll({ clienteId: user.sub });
  }

  // Una clienta vuelve de la pasarela de pago y necesita poder consultar el
  // estado real de SU compra (la URL se puede escribir a mano, no prueba
  // nada) — sin esto recibía 403 y nunca sabía si se cobró. El listado
  // (GET /ventas) sigue siendo solo de staff.
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL', 'CUSTOMER')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<VentaResponseDto> {
    const venta = await this.ventasService.findOne(id);
    // `?? ''` para que una venta histórica sin cliente no sea legible por
    // nadie que no sea staff.
    if (user.role === 'CUSTOMER') {
      assertOwnUser(venta.clienteId ?? '', user);
    } else {
      const propia = sucursalDelStaff(user);
      if (propia && venta.sucursalId !== propia) {
        throw new ForbiddenActionException('La venta es de otra sucursal');
      }
    }
    return venta;
  }
}
