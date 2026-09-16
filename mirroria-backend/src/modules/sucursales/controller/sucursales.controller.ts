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
import { CreateSucursalDto } from '../dto/create-sucursal.dto.js';
import type { SucursalResponseDto } from '../dto/sucursales-response.dto.js';
import { SucursalesService } from '../service/sucursales.service.js';

// RF03: administrar sucursales — ADMIN únicamente. GET queda público (RF08:
// el cliente necesita ver sucursales para elegir dónde retirar/probar).
@ApiTags('sucursales')
@Controller('sucursales')
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateSucursalDto): Promise<SucursalResponseDto> {
    return this.sucursalesService.create(dto);
  }

  @Get()
  findAll(): Promise<SucursalResponseDto[]> {
    return this.sucursalesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<SucursalResponseDto> {
    return this.sucursalesService.findOneResponse(id);
  }
}
