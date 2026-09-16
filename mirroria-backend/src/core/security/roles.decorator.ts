import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Uso: @Roles('ADMIN', 'ENCARGADO_SUCURSAL') sobre un método de controller,
 * siempre junto a @UseGuards(JwtAuthGuard, RolesGuard).
 * Roles válidos: CUSTOMER | ADMIN | ENCARGADO_SUCURSAL | CAJERO (ver Diseño_BD.md, usuarios.role).
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
