import type { UsoPlan } from '../types/catalogo-admin.types';

export interface ResumenPlan {
  texto: string;
  /** Ya no entran más prendas activas: el próximo alta da 409. */
  lleno: boolean;
  /** Queda 1 lugar o menos (sin estar lleno todavía cuenta como aviso). */
  casiLleno: boolean;
}

/** Texto corto del cupo de prendas del plan para la cabecera del catálogo. */
export function resumenPlan(uso: UsoPlan | null, activosEnLista: number): ResumenPlan {
  if (!uso) return { texto: `${activosEnLista} prendas activas`, lleno: false, casiLleno: false };
  const activos = uso.productosActivos;
  if (uso.maxProductos === null) {
    return { texto: `${activos} prendas activas · plan ${uso.planNombre} sin límite`, lleno: false, casiLleno: false };
  }
  const lleno = activos >= uso.maxProductos;
  return {
    texto: `${activos} de ${uso.maxProductos} prendas activas del plan ${uso.planNombre}`,
    lleno,
    casiLleno: !lleno && uso.maxProductos - activos <= 1,
  };
}
