import { SetMetadata } from '@nestjs/common';

export const PERMITIR_TIENDA_NO_DISPONIBLE = 'permitirTiendaNoDisponible';

/** La ruta sigue andando con la tienda vencida o suspendida (/me, /saas/mi-suscripcion). */
export const PermitirTiendaNoDisponible = () => SetMetadata(PERMITIR_TIENDA_NO_DISPONIBLE, true);
