import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard genérico y reutilizable por cualquier módulo: @UseGuards(JwtAuthGuard).
 * La estrategia 'jwt' concreta (que sí conoce la entidad Usuario) vive en
 * modules/seguridad/security/jwt.strategy.ts — core no debe depender de ningún módulo de negocio.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
