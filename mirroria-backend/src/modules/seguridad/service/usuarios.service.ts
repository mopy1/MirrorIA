import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { EntityManager } from 'typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { assertDentroDelPlan } from '../../../core/tenancy/limites-plan.js';
import { soloTenant } from '../../../core/tenancy/tenant-context.js';
import { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { UsuarioAdminResponseDto } from '../dto/usuario-admin-response.dto.js';
import type { UpdateUsuarioEstadoDto } from '../dto/update-usuario-estado.dto.js';
import type { UpdateUsuarioRolDto } from '../dto/update-usuario-rol.dto.js';
import { ROLES_STAFF, RolUsuario, Usuario } from '../entities/usuario.entity.js';
import { normalizarEmail, SALT_ROUNDS } from './auth.service.js';

const ROLES_CON_SUCURSAL = [RolUsuario.ENCARGADO_SUCURSAL, RolUsuario.CAJERO];
const esStaff = (rol: RolUsuario) => ROLES_STAFF.includes(rol);

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly sucursalesService: SucursalesService,
  ) {}

  async findAll(): Promise<UsuarioAdminResponseDto[]> {
    const usuarios = await this.usuarioRepository.find({
      where: soloTenant({}),
      order: { createdAt: 'DESC' },
    });
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
    // Límite del plan: pasar a alguien de clienta a staff suma un usuario del equipo.
    if (usuario.isActive && !esStaff(usuario.role) && esStaff(dto.role)) {
      assertDentroDelPlan('usuariosStaff', await this.contarStaffActivo());
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
    // Reactivar a alguien del equipo vuelve a ocupar un lugar del plan.
    if (dto.isActive && !usuario.isActive && esStaff(usuario.role)) {
      assertDentroDelPlan('usuariosStaff', await this.contarStaffActivo());
    }
    usuario.isActive = dto.isActive;
    const guardado = await this.usuarioRepository.save(usuario);
    return this.toResponse(guardado);
  }

  /** ADMIN de una tienda recién creada (aprovisionamiento, dentro de su transacción y conTenant). */
  async crearAdminInicial(
    datos: { email: string; password: string; fullName: string },
    manager: EntityManager,
  ): Promise<Usuario> {
    const repo = manager.getRepository(Usuario);
    return repo.save(
      repo.create({
        email: normalizarEmail(datos.email),
        passwordHash: await bcrypt.hash(datos.password, SALT_ROUNDS),
        fullName: datos.fullName,
        role: RolUsuario.ADMIN,
        sucursalId: null,
        isActive: true,
      }),
    );
  }

  /** Id de un usuario de la tienda del contexto por email (seed: propietario de MirrorIA). */
  async idPorEmail(email: string): Promise<string | null> {
    const usuario = await this.usuarioRepository.findOne({
      where: soloTenant({ email: normalizarEmail(email) }),
    });
    return usuario?.id ?? null;
  }

  /** Crea la cuenta DUENO_PLATAFORMA (tenant_id NULL) si no existe. Idempotente. */
  async asegurarDuenoPlataforma(email: string, password: string): Promise<boolean> {
    const normalizado = normalizarEmail(email);
    const existente = await this.usuarioRepository.findOne({
      where: { email: normalizado, tenantId: IsNull() }, // sin-tenant: cuenta de plataforma
    });
    if (existente) return false;
    await this.usuarioRepository.save(
      this.usuarioRepository.create({
        tenantId: null,
        email: normalizado,
        passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
        fullName: 'Plataforma MirrorIA',
        role: RolUsuario.DUENO_PLATAFORMA,
        sucursalId: null,
        isActive: true,
      }),
    );
    this.logger.log(`Cuenta de plataforma creada: ${normalizado}`);
    return true;
  }

  /** Nombre y email de los propietarios, para el panel de la plataforma (no expone nada más). */
  async contactosPorIds(ids: string[]): Promise<Map<string, { fullName: string; email: string }>> {
    if (ids.length === 0) return new Map();
    const usuarios = await this.usuarioRepository.find({
      where: { id: In(ids) }, // sin-tenant: solo lo llama la plataforma, por ids de propietarios
      select: { id: true, fullName: true, email: true },
    });
    return new Map(usuarios.map((u) => [u.id, { fullName: u.fullName, email: u.email }]));
  }

  private contarStaffActivo(): Promise<number> {
    return this.usuarioRepository.count({
      where: soloTenant({ role: In(ROLES_STAFF), isActive: true }),
    });
  }

  // RF02: nadie se quita a sí mismo el acceso de ADMIN, y nunca quedan 0 ADMIN
  // activos EN LA TIENDA (nadie podría volver a gestionar usuarios desde el panel).
  private async assertNoDejaSinAdmin(usuario: Usuario, actualId: string, accion: string) {
    if (usuario.id === actualId) {
      throw new OperacionInvalidaException(`No podés ${accion}: pedíselo a otro administrador`);
    }
    const adminsActivos = await this.usuarioRepository.count({
      where: soloTenant({ role: RolUsuario.ADMIN, isActive: true }),
    });
    if (usuario.isActive && adminsActivos <= 1) {
      throw new OperacionInvalidaException('Es el último administrador activo: no se puede dejar sin ADMIN');
    }
  }

  private async findOrFail(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: soloTenant({ id }) });
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
