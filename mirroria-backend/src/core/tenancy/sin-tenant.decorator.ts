import { SetMetadata } from '@nestjs/common';

export const SIN_TENANT = 'sinTenant';

/** La ruta no exige tienda (plataforma, webhooks, login), pero la toma si viene. */
export const SinTenant = () => SetMetadata(SIN_TENANT, true);
