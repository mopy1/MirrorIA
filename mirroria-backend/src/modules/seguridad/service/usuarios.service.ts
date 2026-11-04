import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { UsuarioAdminResponseDto } from '../dto/usuario-admin-response.dto.js';
import type { UpdateUsuarioEstadoDto } from '../dto/update-usuario-estado.dto.js';
import type { UpdateUsuarioRolDto } from '../dto/update-usuario-rol.dto.js';
import { RolUsuario, Usuario } from '../entities/usuario.entity.js';

const ROLES_CON_SUCURSAL = [RolUsuario.ENCARGADO_SUCURSAL, RolUsuario.CAJERO];

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly sucursalesService: SucursalesService,
  ) {}

  async findAll(): Promise<UsuarioAdminResponseDto[]> {
    const usuarios = await this.usuarioRepository.find({ order: { createdAt: 'DESC' } });
    return usuarios.map((u) => this.toResponse(u));
  }

  async updateRol(
    id: string,
    dto: UpdateUsuarioRolDto,
    actualId: string,
  ): Promise<UsuarioAdminResponseDto> {
    const usuario = await this.findOrFail(id);
    if (usuario.role === RolUsuario.ADMIN && dto.role !== RolUsuario.ADMIN) {
      await this.assertNoDejaSinAdmin(usuario, actualId, 'quitarte el rol de administrador');
    }

    const necesitaSucursal = ROLES_CON_SUCURSAL.includes(dto.role);
    if (necesitaSucursal && !dto.sucursalId) {
      throw new OperacionInvalidaException(
        `El rol ${dto.role} requiere asignar una sucursal (sucursalId)`,
      );
    }
    if (necesitaSucursal) {
      await this.sucursalesService.assertExists(dto.sucursalId!);
    }

    usuario.role = dto.role;
    usuario.sucursalId = necesitaSucursal ? dto.sucursalId! : null;
    const guardado = await this.usuarioRepository.save(usuario);
    return this.toResponse(guardado);
  }

  async updateEstado(
    id: string,
    dto: UpdateUsuarioEstadoDto,
    actualId: string,
  ): Promise<UsuarioAdminResponseDto> {
    const usuario = await this.findOrFail(id);
    if (!dto.isActive && usuario.role === RolUsuario.ADMIN && usuario.isActive) {
      await this.assertNoDejaSinAdmin(usuario, actualId, 'desactivar tu propia cuenta');
    }
    usuario.isActive = dto.isActive;
    const guardado = await this.usuarioRepository.save(usuario);
    return this.toResponse(guardado);
  }

  // RF02: nadie se quita a sí mismo el acceso de ADMIN, y nunca quedan 0 ADMIN
  // activos (nadie podría volver a gestionar usuarios desde el panel).
  private async assertNoDejaSinAdmin(usuario: Usuario, actualId: string, accion: string) {
    if (usuario.id === actualId) {
      throw new OperacionInvalidaException(`No podés ${accion}: pedíselo a otro administrador`);
    }
    const adminsActivos = await this.usuarioRepository.count({
      where: { role: RolUsuario.ADMIN, isActive: true },
    });
    if (usuario.isActive && adminsActivos <= 1) {
      throw new OperacionInvalidaException('Es el último administrador activo: no se puede dejar sin ADMIN');
    }
  }

  private async findOrFail(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new RecursoNoEncontradoException('Usuario', id);
    }
    return usuario;
  }

  private toResponse(usuario: Usuario): UsuarioAdminResponseDto {
    return {
      id: usuario.id,
      email: usuario.email,
      fullName: usuario.fullName,
      role: usuario.role,
      sucursalId: usuario.sucursalId,
      isActive: usuario.isActive,
      createdAt: usuario.createdAt,
    };
  }
}
