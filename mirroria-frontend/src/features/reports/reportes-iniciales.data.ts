import type { Ficha } from "./types/reports.types"

interface ReporteInicialBase {
  id: string
  titulo: string
  ficha: Partial<Ficha>
}

export interface StatInicial extends ReporteInicialBase {
  tipo: "stat"
  esMoneda: boolean
}

export interface ChartInicial extends ReporteInicialBase {
  tipo: "chart"
}

export type ReporteInicial = StatInicial | ChartInicial

/** Reportes que se cargan solos al entrar a /admin/reportes, sin pasar por
 * el modelo de IA: van directo a `POST /ia/reportes/consulta` (ficha armada
 * a mano — ver `mirroria-backend/AGENTS.md`, sección `ia`) para que la
 * pantalla no arranque vacía esperando que alguien pregunte algo primero. */
export const REPORTES_INICIALES: ReporteInicial[] = [
  {
    id: "ingresos-totales",
    titulo: "Ingresos totales",
    ficha: { metrica: "ingresos", agruparPor: "ninguno" },
    tipo: "stat",
    esMoneda: true,
  },
  {
    id: "ventas-realizadas",
    titulo: "Ventas realizadas",
    ficha: { metrica: "cantidad_ventas", agruparPor: "ninguno" },
    tipo: "stat",
    esMoneda: false,
  },
  {
    id: "reservas-registradas",
    titulo: "Reservas registradas",
    ficha: { metrica: "cantidad_reservas", agruparPor: "ninguno" },
    tipo: "stat",
    esMoneda: false,
  },
  {
    id: "productos-catalogo",
    titulo: "Productos en catálogo",
    ficha: { metrica: "cantidad_productos", agruparPor: "ninguno" },
    tipo: "stat",
    esMoneda: false,
  },
  {
    id: "ingresos-sucursal",
    titulo: "Ingresos por sucursal",
    ficha: { metrica: "ingresos", agruparPor: "sucursal" },
    tipo: "chart",
  },
  {
    id: "top-productos",
    titulo: "Top productos más vendidos",
    ficha: { metrica: "unidades", agruparPor: "producto", orden: "desc", limite: 5 },
    tipo: "chart",
  },
]
