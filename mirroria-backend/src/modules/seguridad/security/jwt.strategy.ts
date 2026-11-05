import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Usuario } from '../entities/usuario.entity.js';
import { leerJwtSecret } from './jwt-secret.js';

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
      secretOrKey: leerJwtSecret(config),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Revalida contra BD en cada request (no solo confía en el token) para que
    // desactivar un usuario (is_active = false) lo deslogue de inmediato.
    // sin-tenant: el sub viene firmado; el tenant se toma de la BD, no del token.
    const usuario = await this.usuarioRepository.findOne({
      where: { id: payload.sub },
    });
    if (!usuario || !usuario.isActive) {
      // 401 (no 500): el front lo toma como sesión vencida y la cierra.
      throw new UnauthorizedException('Tu cuenta está desactivada o ya no existe');
    }
    return {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      sucursalId: usuario.sucursalId,
      tenantId: usuario.tenantId,
    };
  }
}
