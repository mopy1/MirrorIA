// Espejo de los contratos del módulo `saas` del backend (mismos tipos que la web:
// mirroria-frontend/src/types/{tienda,plan,marca}.types.ts y features/saas/types).
import type { AuthResponse } from '@/src/features/auth/types/auth.types';

export type ModoMarca = 'CLARO' | 'OSCURO';
export type RadioMarca = 'RECTO' | 'SUAVE' | 'REDONDO';
export type FuenteMarca = 'geist' | 'outfit' | 'dm-sans' | 'playfair';
export type DestinoCta = 'CATALOGO' | 'PROBADOR' | 'SUCURSALES';
export type NivelMarca = 'ESENCIAL' | 'COMPLETA' | 'MARCA_BLANCA';
export type SeccionMarca = 'MARCA' | 'COLORES' | 'PORTADA' | 'IMAGENES' | 'TEXTOS' | 'TODO';
export type CodigoPaleta = 'grafito' | 'terracota' | 'oliva' | 'oceano' | 'ciruela' | 'bosque';

export interface HeroMarca {
  imagenUrl: string;
  titulo: string;
  subtitulo: string | null;
  ctaTexto: string;
  ctaDestino: DestinoCta;
  mostrarProbador: boolean;
}

/** La marca EFECTIVA de una tienda (ya recortada por el nivel de su plan). */
export interface MarcaPublica {
  logoUrl: string | null;
  faviconUrl: string | null;
  colorPrimario: string;
  colorAcento: string;
  modo: ModoMarca;
  radio: RadioMarca;
  fuente: FuenteMarca;
  hero: HeroMarca;
  imagenes: { bannerSucursales: string | null; probador: string | null; acceso: string | null };
  textos: { eslogan: string | null; sobreNosotros: string | null };
  contacto: {
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    whatsapp: string | null;
    email: string | null;
  };
  mostrarInsignia: boolean;
}

/** `GET /saas/tiendas`, `GET /saas/tiendas/:slug`. */
export interface TiendaPublica {
  id: string;
  slug: string;
  nombre: string;
  /** false → "Esta tienda no está disponible" (suspendida o vencida). */
  disponible: boolean;
  marca?: MarcaPublica;
}

export type EstadoSuscripcion = 'TRIAL' | 'ACTIVA' | 'VENCIDA' | 'CANCELADA';

export interface LimitesPlanDto {
  maxSucursales: number | null; // null = ilimitado
  maxProductos: number | null;
  maxUsuariosStaff: number | null;
}

export interface PlanDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioMensualCents: number; // BOB
  precioMensualUsdCents: number; // USD
  diasPrueba: number;
  orden: number;
  activo: boolean;
  limites: LimitesPlanDto;
  nivelMarca?: NivelMarca;
  destacado?: boolean;
}

export interface UsoPlanDto {
  sucursales: number;
  productos: number;
  usuariosStaff: number;
}

export interface SuscripcionDto {
  id: string;
  estado: EstadoSuscripcion;
  plan: Pick<PlanDto, 'id' | 'codigo' | 'nombre'>;
  inicio: string;
  fin: string;
  diasRestantes: number;
  precioCents: number;
  proveedorPago: string | null;
  referenciaPago: string | null;
}

export interface DisponibilidadSlugDto {
  slug: string;
  disponible: boolean;
  motivo: 'FORMATO' | 'RESERVADO' | 'OCUPADO' | null;
}

export interface RegistrarTiendaDto {
  planCodigo: string;
  tienda: { nombre: string; slug: string; paleta?: CodigoPaleta };
  sucursal: { nombre: string; direccion: string; ciudadId: string; telefono?: string };
  admin: { fullName: string; email: string; password: string };
}

export interface RegistroTiendaResponse extends AuthResponse {
  tienda: TiendaPublica;
  suscripcion: SuscripcionDto;
  sucursalId: string;
}

export interface Ciudad {
  id: string;
  nombre: string;
}
