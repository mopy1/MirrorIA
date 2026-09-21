import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { RecursoDuplicadoException } from '../../../core/exception/recurso-duplicado.exception.js';
import type { AuthResponseDto, UsuarioResponseDto } from '../dto/auth-response.dto.js';
import type { LoginDto } from '../dto/login.dto.js';
import type { RegisterDto } from '../dto/register.dto.js';
import { CredencialesInvalidasException } from '../exception/credenciales-invalidas.exception.js';
import { RolUsuario, Usuario } from '../entities/usuario.entity.js';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existente = await this.usuarioRepository.findOne({
      where: { email: dto.email },
    });
    if (existente) {
      throw new RecursoDuplicadoException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const usuario = await this.usuarioRepository.save(
      this.usuarioRepository.create({
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: RolUsuario.CUSTOMER,
        sucursalId: null,
        isActive: true,
      }),
    );

    return this.buildAuthResponse(usuario);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email: dto.email },
    });
    if (!usuario || !usuario.isActive) {
      throw new CredencialesInvalidasException();
    }

    const passwordValida = await bcrypt.compare(
      dto.password,
      usuario.passwordHash,
    );
    if (!passwordValida) {
      throw new CredencialesInvalidasException();
    }

    return this.buildAuthResponse(usuario);
  }

  async getPerfil(usuarioId: string): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarioRepository.findOneOrFail({
      where: { id: usuarioId },
    });
    return this.toUsuarioResponse(usuario);
  }

  private buildAuthResponse(usuario: Usuario): AuthResponseDto {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      sucursalId: usuario.sucursalId,
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
    };
  }
}
