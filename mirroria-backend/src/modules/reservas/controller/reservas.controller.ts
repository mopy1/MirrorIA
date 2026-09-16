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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ForbiddenActionException } from '../../../core/exception/forbidden-action.exception.js';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { CambiarEstadoReservaDto } from '../dto/cambiar-estado-reserva.dto.js';
import { CreateReservaDto } from '../dto/create-reserva.dto.js';
import type { ReservaResponseDto } from '../dto/reserva-response.dto.js';
import { EstadoReserva } from '../entities/reserva.entity.js';
import { ReservasService } from '../service/reservas.service.js';

// Todo el módulo exige sesión — no hay ninguna operación pública acá
// (a diferencia de catalogo/sucursales/inventario).
@ApiTags('reservas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  // RF09/RF10: el propio cliente reserva — clienteId sale del token.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateReservaDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReservaResponseDto> {
    return this.reservasService.create(dto, user.sub);
  }

  // RF12: "consultar el estado de una reserva" — mis propias reservas.
  @Get('mias')
  misReservas(@CurrentUser() user: JwtPayload): Promise<ReservaResponseDto[]> {
    return this.reservasService.findAll({ clienteId: user.sub });
  }

  // Consulta de staff, por sucursal/estado (RF: encargado "consultar reservas").
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  findAll(
    @Query('sucursalId') sucursalId?: string,
    @Query('estado') estado?: string,
  ): Promise<ReservaResponseDto[]> {
    return this.reservasService.findAll({ sucursalId, estado });
  }

  // Dueño (cliente) o staff — no ambos guards a la vez porque el cliente no
  // tiene rol ADMIN/ENCARGADO_SUCURSAL, así que se resuelve a mano acá.
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReservaResponseDto> {
    const reserva = await this.reservasService.findOne(id);
    const esStaff = user.role === 'ADMIN' || user.role === 'ENCARGADO_SUCURSAL';
    if (!esStaff && reserva.clienteId !== user.sub) {
      throw new ForbiddenActionException('No podés ver la reserva de otro cliente');
    }
    return this.reservasService.findOneResponse(id);
  }

  // Staff: confirmar, marcar en tienda, cancelar por la tienda, expirar, no-show.
  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  cambiarEstado(
    @Param('id') id: string,
    @Body() dto: CambiarEstadoReservaDto,
  ): Promise<ReservaResponseDto> {
    return this.reservasService.cambiarEstado(id, dto.estado as EstadoReserva);
  }

  // RF: el cliente cancela su propia reserva.
  @Patch(':id/cancelar')
  cancelar(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReservaResponseDto> {
    return this.reservasService.cancelar(id, user.sub);
  }
}
