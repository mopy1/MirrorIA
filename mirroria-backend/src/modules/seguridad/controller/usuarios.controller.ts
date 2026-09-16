import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import type { UsuarioAdminResponseDto } from '../dto/usuario-admin-response.dto.js';
import { UpdateUsuarioEstadoDto } from '../dto/update-usuario-estado.dto.js';
import { UpdateUsuarioRolDto } from '../dto/update-usuario-rol.dto.js';
import { RolUsuario } from '../entities/usuario.entity.js';
import { UsuariosService } from '../service/usuarios.service.js';

// RF02: gestionar usuarios y roles — ADMIN únicamente.
@ApiTags('seguridad/usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
@Controller('seguridad/usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll(): Promise<UsuarioAdminResponseDto[]> {
    return this.usuariosService.findAll();
  }

  @Patch(':id/rol')
  updateRol(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioRolDto,
  ): Promise<UsuarioAdminResponseDto> {
    return this.usuariosService.updateRol(id, dto);
  }

  @Patch(':id/estado')
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioEstadoDto,
  ): Promise<UsuarioAdminResponseDto> {
    return this.usuariosService.updateEstado(id, dto);
  }
}
