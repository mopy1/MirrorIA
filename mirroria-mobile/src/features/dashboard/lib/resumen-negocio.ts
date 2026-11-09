import type { DashboardEjecutivoDto, LimiteRecursoPlanDto } from "../types/dashboard.types"
import { formatearMontoRedondo } from "./dashboard.utils"
import { introPeriodo, periodoDeComparacion } from "./fechas-dashboard"
import { agruparPagosPorMetodo } from "./metodos-pago"

export interface AvisoNegocio {
  id: string
  tono: "info" | "atencion" | "bien"
  texto: string
  href?: string
  accion?: string
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Cantidad de compras del período (suma de la serie diaria). */
export function contarCompras(data: DashboardEjecutivoDto): number {
  return data.graficos.tendenciaIngresos.reduce((acc, d) => acc + d.ventas, 0)
}

/** La conclusión del período en una o dos frases, sin jerga. */
export function armarResumenNegocio(data: DashboardEjecutivoDto): string {
  const intro = introPeriodo(data.periodo)
  const { ingresos } = data.kpis
  const comparado = periodoDeComparacion(data.periodo.clave)

  if (ingresos.montoBs <= 0) {
    return `${intro} todavía no hay ventas registradas. Cuando vendas, aquí vas a ver cuánto entró, cómo te pagaron y qué prendas salen más.`
  }

  const compras = contarCompras(data)
  const anterior = ingresos.anteriorMontoCents / 100
  const pct = Math.round(Math.abs(ingresos.variacionPorcentaje))
  let comparacion: string
  if (anterior <= 0) comparacion = `En ${comparado} no hubo ventas, así que este es tu punto de partida.`
  else if (pct === 0) comparacion = `Es lo mismo que en ${comparado}.`
  else comparacion = `Es ${pct}% ${ingresos.variacionPorcentaje > 0 ? "más" : "menos"} que en ${comparado}.`

  const frases = [`${intro} vendiste ${formatearMontoRedondo(ingresos.montoBs)} en ${plural(compras, "compra", "compras")}.`, comparacion]

  const estrella = data.graficos.topPrendas[0]
  const pagos = agruparPagosPorMetodo(data.graficos.distribucionPagos)
  const dominante = [...pagos].sort((a, b) => b.montoBs - a.montoBs)[0]
  if (estrella && dominante) {
    frases.push(`Lo que más salió fue ${estrella.nombre} (${plural(estrella.unidadesVendidas, "unidad", "unidades")}) y la mayoría te pagó con ${dominante.nombre.toLowerCase()}.`)
  } else if (estrella) {
    frases.push(`Lo que más salió fue ${estrella.nombre} (${plural(estrella.unidadesVendidas, "unidad", "unidades")}).`)
  }
  return frases.join(" ")
}

function limiteCercano(limites: Record<string, LimiteRecursoPlanDto>): [string, LimiteRecursoPlanDto] | null {
  const nombres: Record<string, string> = { productos: "prendas", sucursales: "sucursales", usuariosStaff: "personas del equipo" }
  const candidato = Object.entries(limites)
    .filter(([, l]) => l.maximo !== null && (l.porcentaje ?? 0) >= 80)
    .sort(([, a], [, b]) => (b.porcentaje ?? 0) - (a.porcentaje ?? 0))[0]
  return candidato ? [nombres[candidato[0]] ?? candidato[0], candidato[1]] : null
}

/** "Qué mirar": hasta 3 avisos accionables, cada uno con su destino. */
export function armarAvisosNegocio(data: DashboardEjecutivoDto): AvisoNegocio[] {
  const avisos: AvisoNegocio[] = []
  const rot = data.kpis.rotacionInventario
  if (rot.interpretacion === "LENTA" && rot.stockTotalDisponible > 0) {
    avisos.push({
      id: "stock-lento",
      tono: "atencion",
      texto: `Tu stock se vende lento: salieron ${rot.unidadesVendidas} de ${rot.stockTotalDisponible} prendas disponibles. Mirá qué conviene rebajar o dejar de pedir.`,
      href: "/admin/inventario",
      accion: "Ver inventario",
    })
  } else if (rot.interpretacion === "ALTA") {
    avisos.push({
      id: "stock-rapido",
      tono: "info",
      texto: "Tu stock se está vendiendo rápido. Revisá qué prendas reponer antes de que se agoten.",
      href: "/admin/inventario",
      accion: "Ver inventario",
    })
  }

  const conv = data.kpis.conversionReservas
  if (conv.totalReservasCerradas > 0 && conv.reservasConVenta / conv.totalReservasCerradas < 0.5) {
    avisos.push({
      id: "reservas-sin-compra",
      tono: "atencion",
      texto: `De ${plural(conv.totalReservasCerradas, "reserva", "reservas")}, ${conv.reservasConVenta === 0 ? "ninguna terminó" : conv.reservasConVenta === 1 ? "solo 1 terminó" : `solo ${conv.reservasConVenta} terminaron`} en compra. Confirmar la visita un día antes ayuda a que vengan.`,
      href: "/admin/reservas",
      accion: "Ver reservas",
    })
  }

  const limite = limiteCercano(data.planSaaS.limites)
  if (limite) {
    const [nombre, l] = limite
    avisos.push({
      id: "limite-plan",
      tono: "atencion",
      texto: `Ya usás ${l.actual} de ${l.maximo} ${nombre} que permite tu plan.`,
      href: "/admin/suscripcion",
      accion: "Ver plan",
    })
  }

  if (avisos.length === 0) {
    avisos.push({ id: "todo-bien", tono: "bien", texto: "Nada urgente por revisar: el stock, las reservas y tu plan están en orden." })
  }
  return avisos.slice(0, 3)
}
