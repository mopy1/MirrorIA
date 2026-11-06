import { formatMoney } from "@/lib/money"
import type { Reporte } from "../types/reports.types"

/** `undefined` = todavía cargando; `null` = falló; `Reporte` = datos. */
export type Dato = Reporte | null | undefined

export interface DatosCifras {
  ingresos: Dato
  ventas: Dato
  /** `cantidad_reservas` agrupado por estado. */
  reservas: Dato
  productos: Dato
  categorias: Dato
}

export interface Cifra {
  id: string
  nombre: string
  /** Texto ya formateado; null si cargando o sin dato. */
  valor: string | null
  /** Frase que dice con qué se compara o qué significa el número. */
  contexto: string
  cargando: boolean
  ayuda?: string
}

const ESTADOS_NO_CONCRETADOS = new Set(["CANCELADA", "EXPIRADA", "NO_SHOW"])

function total(r: Reporte): number {
  return r.filas.reduce((acc, f) => acc + f.valor, 0)
}

function contar(n: number): string {
  return n.toLocaleString("es-BO")
}

function plural(n: number, uno: string, varios: string): string {
  return `${contar(n)} ${n === 1 ? uno : varios}`
}

function porEstado(r: Reporte, pred: (estado: string) => boolean): number {
  return r.filas.filter((f) => pred((f.clave || f.etiqueta).toUpperCase())).reduce((a, f) => a + f.valor, 0)
}

const SIN_DATO = "No se pudo cargar este dato"

/** Las 4 cifras del inicio, cada una con su contexto en palabras (nunca un número suelto). */
export function armarCifras(d: DatosCifras): Cifra[] {
  const ventas = d.ventas ? total(d.ventas) : 0
  const ingresos = d.ingresos ? total(d.ingresos) : 0

  const vendido: Cifra = {
    id: "vendido",
    nombre: "Lo que vendiste",
    cargando: d.ingresos === undefined,
    valor: d.ingresos ? formatMoney(ingresos) : null,
    contexto: !d.ingresos
      ? SIN_DATO
      : !d.ventas || ventas === 0
        ? "Todavía no hay compras pagadas"
        : `En ${plural(ventas, "compra pagada", "compras pagadas")}`,
  }

  const promedio: Cifra = {
    id: "promedio",
    nombre: "Gasto promedio por compra",
    ayuda: "Lo vendido dividido por la cantidad de compras pagadas: cuánto deja cada compra, en promedio.",
    cargando: d.ingresos === undefined || d.ventas === undefined,
    valor: d.ingresos && d.ventas && ventas > 0 ? formatMoney(Math.round(ingresos / ventas)) : null,
    contexto: !d.ingresos || !d.ventas ? SIN_DATO : ventas > 0 ? "Por cada compra pagada" : "Aparece con la primera venta",
  }

  const totalReservas = d.reservas ? total(d.reservas) : 0
  const reservas: Cifra = {
    id: "reservas",
    nombre: "Reservas",
    cargando: d.reservas === undefined,
    valor: d.reservas ? contar(totalReservas) : null,
    contexto: !d.reservas
      ? SIN_DATO
      : totalReservas === 0
        ? "Todavía nadie reservó una prenda"
        : `${plural(porEstado(d.reservas, (e) => e === "COMPLETADA"), "terminó", "terminaron")} en compra · ` +
          `${plural(porEstado(d.reservas, (e) => ESTADOS_NO_CONCRETADOS.has(e)), "no se concretó", "no se concretaron")}`,
  }

  const totalCategorias = d.categorias ? total(d.categorias) : 0
  const catalogo: Cifra = {
    id: "catalogo",
    nombre: "Prendas en el catálogo",
    cargando: d.productos === undefined,
    valor: d.productos ? contar(total(d.productos)) : null,
    contexto: !d.productos
      ? SIN_DATO
      : totalCategorias > 0
        ? `Organizadas en ${plural(totalCategorias, "categoría", "categorías")}`
        : "Sin categorías todavía",
  }

  return [vendido, promedio, reservas, catalogo]
}
