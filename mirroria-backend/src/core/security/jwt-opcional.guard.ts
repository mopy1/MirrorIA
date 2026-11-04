import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Como JwtAuthGuard pero nunca rechaza: con token válido deja `req.user`, sin
 * token (o con uno inválido) sigue como público con `req.user` vacío. Para
 * rutas públicas que muestran algo más al staff (ej. un producto inactivo al ADMIN).
 */
@Injectable()
export class JwtOpcionalGuard extends AuthGuard('jwt') {
  handleRequest<T>(_err: unknown, user: T): T {
    return user;
  }
}
