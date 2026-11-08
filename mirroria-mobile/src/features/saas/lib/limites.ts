import type { LimitesPlanDto, PlanDto, UsoPlanDto } from '../types/saas.types';

/** `null` = ilimitado. Los tres recursos son femeninos (sucursales, prendas, cuentas). */
export function formatLimite(valor: number | null, singular: string, plural: string): string {
  if (valor === null) return `${plural.charAt(0).toUpperCase()}${plural.slice(1)} ilimitadas`;
  return `${valor} ${valor === 1 ? singular : plural}`;
}

/** Recursos con tope por plan, siempre en el mismo orden (como la web). */
export const FILAS_LIMITES: {
  clave: keyof LimitesPlanDto;
  uso: keyof UsoPlanDto;
  titulo: string;
  singular: string;
  plural: string;
}[] = [
  { clave: 'maxSucursales', uso: 'sucursales', titulo: 'Sucursales', singular: 'sucursal', plural: 'sucursales' },
  { clave: 'maxProductos', uso: 'productos', titulo: 'Prendas activas', singular: 'prenda activa', plural: 'prendas activas' },
  { clave: 'maxUsuariosStaff', uso: 'usuariosStaff', titulo: 'Cuentas del equipo', singular: 'cuenta de staff', plural: 'cuentas de staff' },
];

/** "1 sucursal · 50 prendas activas · 3 cuentas de staff". */
export function resumenLimites(limites: LimitesPlanDto): string {
  return FILAS_LIMITES.map((f) => formatLimite(limites[f.clave], f.singular, f.plural)).join(' · ');
}

/** Porcentaje de uso (0-100) o null si es ilimitado. */
export function porcentajeUso(uso: number, limite: number | null): number | null {
  if (limite === null) return null;
  if (limite <= 0) return 100;
  return Math.min(100, Math.round((uso / limite) * 100));
}

/** El plan "Más elegido": el marcado por la plataforma, o "crecimiento" si el backend no manda la marca. */
export function esDestacado(plan: Pick<PlanDto, 'codigo' | 'destacado'>, planes: Pick<PlanDto, 'destacado'>[]): boolean {
  const hayMarca = planes.some((p) => p.destacado !== undefined);
  return hayMarca ? Boolean(plan.destacado) : plan.codigo === 'crecimiento';
}

/** Lo que trae cualquier plan (igual que la web). */
export const INCLUIDO_EN_TODOS = [
  'Tienda online con tu dirección propia',
  'Vestidor virtual con IA',
  'Cobro por QR, tarjeta y efectivo',
  'Reservas para probarse en sucursal',
  'Reportes en lenguaje natural',
];

/** Qué incluye cada nivel de personalización de la marca. */
export const NIVELES: Record<string, { plan: string; incluye: string; resumen: string }> = {
  ESENCIAL: { plan: 'Básico', incluye: 'Logo, colores, portada, textos y redes', resumen: 'logo, colores, portada, textos y redes' },
  COMPLETA: { plan: 'Crecimiento', incluye: 'Además: fuente, bordes, modo oscuro e imágenes de secciones', resumen: 'también fuente, bordes, modo oscuro e imágenes' },
  MARCA_BLANCA: { plan: 'Cadena', incluye: 'Además: favicon propio y sin "Hecho con MirrorIA"', resumen: 'personalización completa, con favicon y sin insignia' },
};

/** Precio entero en Bs (los planes no tienen centavos): 9900 → "Bs 99". */
export function precioPlanBs(cents: number): string {
  return `Bs ${Math.round(cents / 100).toLocaleString('es-BO')}`;
}

export function precioPlanUsd(cents: number): string {
  return `US$ ${(cents / 100).toFixed(2)}`;
}
