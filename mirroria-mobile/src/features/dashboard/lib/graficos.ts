import type {
  LimiteRecursoPlanDto,
  PlanSaaSEjecutivoDto,
  TendenciaIngresoDiaDto,
  TopPrendaDto,
  TopProveedorDto,
} from '../types/dashboard.types';
import { formatearMontoBs } from './dashboard.utils';
import { fechaCorta } from './fechas-dashboard';

/** Misma forma que `Punto` de components/admin/Graficos (sin importar react-native acá). */
export interface PuntoGrafico {
  etiqueta: string;
  valor: number;
}

export interface FilaBarra {
  id: string;
  nombre: string;
  detalle: string;
  valor: string;
  /** 0-1 respecto del mayor de la lista. */
  proporcion: number;
  imagenUrl?: string | null;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Serie diaria → puntos de la línea de tendencia ("6 nov" → Bs). */
export function tendenciaAPuntos(dias: TendenciaIngresoDiaDto[] = []): PuntoGrafico[] {
  return dias.map((d) => ({ etiqueta: fechaCorta(d.fecha), valor: Number(d.ingresosBs) || 0 }));
}

/** El día con más ingresos, o null si no hubo ventas. */
export function mejorDia(dias: TendenciaIngresoDiaDto[] = []): TendenciaIngresoDiaDto | null {
  const mejor = dias.reduce<TendenciaIngresoDiaDto | null>(
    (m, d) => (!m || d.ingresosBs > m.ingresosBs ? d : m),
    null
  );
  return mejor && mejor.ingresosBs > 0 ? mejor : null;
}

export function filasPrendas(prendas: TopPrendaDto[] = []): FilaBarra[] {
  const max = Math.max(1, ...prendas.map((p) => p.unidadesVendidas));
  return prendas.map((p) => {
    const unidades = plural(p.unidadesVendidas, 'unidad vendida', 'unidades vendidas');
    return {
      id: p.productoId,
      nombre: p.nombre,
      detalle: p.categoria ? `${unidades} · ${p.categoria}` : unidades,
      valor: formatearMontoBs(p.ingresosBs),
      proporcion: p.unidadesVendidas / max,
      imagenUrl: p.imagenUrl,
    };
  });
}

export function filasProveedores(proveedores: TopProveedorDto[] = []): FilaBarra[] {
  const max = Math.max(1, ...proveedores.map((p) => p.ingresosBs));
  return proveedores.map((p) => ({
    id: p.proveedorId,
    nombre: p.nombre,
    detalle: plural(p.unidadesVendidas, 'prenda vendida', 'prendas vendidas'),
    valor: formatearMontoBs(p.ingresosBs),
    proporcion: p.ingresosBs / max,
  }));
}

export interface UsoRecurso {
  clave: string;
  texto: string;
  /** null = sin límite (no se dibuja barra). */
  porcentaje: number | null;
  cerca: boolean;
}

const RECURSOS: { clave: keyof PlanSaaSEjecutivoDto['limites']; uno: string; varios: string }[] = [
  { clave: 'productos', uno: 'prenda', varios: 'prendas' },
  { clave: 'sucursales', uno: 'sucursal', varios: 'sucursales' },
  { clave: 'usuariosStaff', uno: 'persona del equipo', varios: 'personas del equipo' },
];

function usoDe(l: LimiteRecursoPlanDto, uno: string, varios: string): Omit<UsoRecurso, 'clave'> {
  if (l.maximo === null) {
    return { texto: `${l.actual} ${l.actual === 1 ? uno : varios} · sin límite`, porcentaje: null, cerca: false };
  }
  const pct = Math.min(l.porcentaje ?? 0, 100);
  return { texto: `${l.actual} de ${l.maximo} ${varios}`, porcentaje: pct, cerca: pct >= 80 };
}

/** Uso del plan en palabras ("9 prendas · sin límite", "2 de 3 sucursales"). */
export function usoDelPlan(plan: PlanSaaSEjecutivoDto): UsoRecurso[] {
  return RECURSOS.map((r) => ({ clave: r.clave, ...usoDe(plan.limites[r.clave], r.uno, r.varios) }));
}

/** Ritmo de rotación en palabras (nunca "0.10x"), como en la web. */
export function ritmoStock(interpretacion: string): { etiqueta: string; tono: 'bien' | 'atencion' } {
  if (interpretacion === 'LENTA') return { etiqueta: 'Lento', tono: 'atencion' };
  if (interpretacion === 'ALTA') return { etiqueta: 'Rápido', tono: 'bien' };
  if (interpretacion === 'SALUDABLE') return { etiqueta: 'A buen ritmo', tono: 'bien' };
  return { etiqueta: 'Sin dato', tono: 'bien' };
}
