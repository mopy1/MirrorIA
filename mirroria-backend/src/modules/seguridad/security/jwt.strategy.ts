import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Usuario } from '../entities/usuario.entity.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev_secret_change_me'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Revalida contra BD en cada request (no solo confía en el token) para que
    // desactivar un usuario (is_active = false) lo deslogue de inmediato.
    const usuario = await this.usuarioRepository.findOne({
      where: { id: payload.sub },
    });
    if (!usuario || !usuario.isActive) {
      throw new Error('Usuario no válido o inactivo');
    }
    return {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      sucursalId: usuario.sucursalId,
    };
  }
}
