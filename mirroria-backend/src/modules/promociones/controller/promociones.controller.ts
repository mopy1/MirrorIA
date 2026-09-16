import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { CreateCuponDto } from '../dto/create-cupon.dto.js';
import { CuponResponseDto } from '../dto/cupon-response.dto.js';
import { ValidarCuponDto } from '../dto/validar-cupon.dto.js';
import { ValidarCuponResponseDto } from '../dto/validar-cupon-response.dto.js';
import { PromocionesService } from '../service/promociones.service.js';

@ApiTags('Promociones')
@Controller('promociones/cupones')
export class PromocionesController {
  constructor(private readonly promocionesService: PromocionesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear un nuevo cupón promocional (ADMIN)' })
  create(@Body() dto: CreateCuponDto): Promise<CuponResponseDto> {
    return this.promocionesService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar todos los cupones (ADMIN)' })
  findAll(): Promise<CuponResponseDto[]> {
    return this.promocionesService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener detalle de un cupón (ADMIN)' })
  findOne(@Param('id') id: string): Promise<CuponResponseDto> {
    return this.promocionesService.findOne(id);
  }

  @Patch(':id/estado')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Alternar estado activo/inactivo de un cupón (ADMIN)' })
  toggleEstado(@Param('id') id: string): Promise<CuponResponseDto> {
    return this.promocionesService.toggleActivo(id);
  }

  @Post('validar')
  @ApiOperation({ summary: 'Validar un cupón y calcular descuento (Público)' })
  validar(@Body() dto: ValidarCuponDto): Promise<ValidarCuponResponseDto> {
    return this.promocionesService.validar(dto.codigo, dto.subtotalCents);
  }
}
