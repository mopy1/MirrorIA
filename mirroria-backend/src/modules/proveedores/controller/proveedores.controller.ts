import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { CreateProveedorDto } from '../dto/create-proveedor.dto.js';
import type { ProveedorResponseDto } from '../dto/proveedor-response.dto.js';
import { ProveedoresService } from '../service/proveedores.service.js';

// RF06: gestionar proveedores — dato interno, sin uso de cliente, ADMIN en todo el recurso
// (a diferencia de catalogo/sucursales, acá ni el GET es público).
@ApiTags('proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProveedorDto): Promise<ProveedorResponseDto> {
    return this.proveedoresService.create(dto);
  }

  @Get()
  findAll(): Promise<ProveedorResponseDto[]> {
    return this.proveedoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProveedorResponseDto> {
    return this.proveedoresService.findOne(id);
  }
}
