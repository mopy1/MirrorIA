import type { CodigoPaleta, MarcaPublica, NivelMarca } from '../../saas/types/saas.types';

export interface PermisosMarca {
  estilo: boolean;
  imagenesSecciones: boolean;
  favicon: boolean;
  quitarInsignia: boolean;
}

/** `GET /saas/mi-marca` (ADMIN). */
export interface MiMarcaDto {
  nombre: string;
  slug: string;
  paleta: CodigoPaleta | 'mirroria';
  guardada: MarcaPublica;
  efectiva: MarcaPublica;
  nivel: NivelMarca;
  planNombre: string;
  permitido: PermisosMarca;
}

/** Lo que se edita: la marca completa + el nombre visible (cuerpo del `PUT /saas/mi-marca`). */
export interface BorradorMarca extends MarcaPublica {
  nombre: string;
}

/** Errores por campo, con la ruta del campo como clave (`hero.titulo`, `contacto.email`...). */
export type ErroresMarca = Partial<Record<string, string>>;

export type PestanaApariencia = 'marca' | 'colores' | 'portada' | 'imagenes' | 'textos';
