/** Misma regla que el backend y la web (spec §1.1 y §2.5). */
export const REGEX_SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export const SLUGS_RESERVADOS = [
  'admin', 'api', 'app', 't', 'www', 'plataforma', 'entrar', 'login', 'registro', 'registro-tienda',
  'planes', 'tiendas', 'wayra', 'assets', 'static', 'soporte', 'ayuda', 'mirroria-admin',
];

/** "Boutique Lila & Co." → "boutique-lila-co" (sugerencia a partir del nombre). */
export function slugDesdeNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

/** Chequeo local antes de preguntarle al backend: null si el formato sirve. */
export function errorDeSlug(slug: string): string | null {
  if (!slug) return 'Elegí la dirección de tu tienda';
  if (!REGEX_SLUG.test(slug)) {
    return 'De 3 a 40 caracteres: minúsculas, números y guiones (sin guion al inicio ni al final)';
  }
  if (SLUGS_RESERVADOS.includes(slug)) return 'Esa dirección está reservada por la plataforma';
  return null;
}

/** Lo que escribe la persona al "entrar por dirección": acepta el link entero (`…/t/casa-andina/…`). */
export function slugDesdeEntrada(valor: string): string {
  const sinLink = valor.trim().replace(/^.*\/t\//, '').split(/[/?#]/)[0] ?? '';
  return slugDesdeNombre(sinLink);
}
