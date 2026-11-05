import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { RecursoDuplicadoException } from '../../../core/exception/recurso-duplicado.exception.js';
import { contextoTenant, soloTenant, tenantOpcional } from '../../../core/tenancy/tenant-context.js';
import type { AuthResponseDto, TenantSesionDto, UsuarioResponseDto } from '../dto/auth-response.dto.js';
import type { LoginDto } from '../dto/login.dto.js';
import type { RegisterDto } from '../dto/register.dto.js';
import { CredencialesInvalidasException } from '../exception/credenciales-invalidas.exception.js';
import { RolUsuario, Usuario } from '../entities/usuario.entity.js';

export const SALT_ROUNDS = 10;

// "Ana@Mail.com " y "ana@mail.com" son la misma cuenta (las usuarias ya
// guardadas están todas en minúscula).
export const normalizarEmail = (email: string) => email.trim().toLowerCase();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  /** Crea una CUSTOMER en la tienda del contexto (X-Tenant obligatorio). */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = normalizarEmail(dto.email);
    const existente = await this.usuarioRepository.findOne({ where: soloTenant({ email }) });
    if (existente) {
      throw new RecursoDuplicadoException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const usuario = await this.usuarioRepository.save(
      this.usuarioRepository.create({
        email,
        passwordHash,
        fullName: dto.fullName,
        role: RolUsuario.CUSTOMER,
        sucursalId: null,
        isActive: true,
      }),
    );

    return this.emitirToken(usuario);
  }

  /**
   * Con X-Tenant busca en esa tienda; sin cabecera, solo cuentas de plataforma
   * (tenant_id NULL). Nunca dice cuál de las dos cosas falló.
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const tenantId = tenantOpcional();
    const email = normalizarEmail(dto.email);
    const usuario = await this.usuarioRepository.findOne({
      where: tenantId ? soloTenant({ email }) : { email, tenantId: IsNull() }, // sin-tenant: login de plataforma
    });
    if (!usuario || !usuario.isActive) {
      throw new CredencialesInvalidasException();
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValida) {
      throw new CredencialesInvalidasException();
    }

    return this.emitirToken(usuario);
  }

  async getPerfil(usuarioId: string): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarioRepository.findOneOrFail({
      where: { id: usuarioId }, // sin-tenant: id del JWT firmado (la plataforma no tiene tienda)
    });
    return this.toUsuarioResponse(usuario);
  }

  /** JWT + perfil. Lo usan login, register y el aprovisionamiento de una tienda nueva. */
  emitirToken(usuario: Usuario): AuthResponseDto {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      sucursalId: usuario.sucursalId,
      tenantId: usuario.tenantId,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      usuario: this.toUsuarioResponse(usuario),
    };
  }

  private toUsuarioResponse(usuario: Usuario): UsuarioResponseDto {
    return {
      id: usuario.id,
      email: usuario.email,
      fullName: usuario.fullName,
      role: usuario.role,
      sucursalId: usuario.sucursalId,
      tenant: this.tenantDeSesion(usuario.tenantId),
    };
  }

  /** Slug y nombre los cargó TenantInterceptor en el contexto: así seguridad no importa saas. */
  private tenantDeSesion(tenantId: string | null): TenantSesionDto | null {
    const ctx = contextoTenant();
    if (!tenantId || ctx?.tenantId !== tenantId || !ctx.slug) return null;
    return { id: tenantId, slug: ctx.slug, nombre: ctx.nombre ?? ctx.slug };
  }
}
