/** Express entrega las cabeceras en minúsculas. Valor: el slug de la tienda, nunca el uuid. */
export const HEADER_TENANT = 'x-tenant';

/** Id fijo de la tienda demo (los datos del Parcial 1 se migraron acá). */
export const MIRRORIA_TENANT_ID = '00000000-0000-4000-a000-000000000001';

/** 3-40 caracteres: minúsculas, dígitos y guiones, sin guion al principio ni al final. */
export const REGEX_SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

/** Rutas del front y nombres que confunden: nadie puede registrar una tienda con estos slugs. */
export const SLUGS_RESERVADOS: readonly string[] = [
  'admin', 'api', 'app', 't', 'www', 'plataforma', 'entrar', 'login', 'registro',
  'registro-tienda', 'planes', 'tiendas', 'wayra', 'assets', 'static', 'soporte',
  'ayuda', 'mirroria-admin',
];
