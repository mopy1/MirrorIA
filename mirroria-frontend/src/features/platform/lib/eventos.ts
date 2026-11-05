import type { TipoEvento } from "../types/plataforma.types"

/** Verbo de cada evento de la bitácora + tono semántico del punto. */
export const EVENTOS: Record<TipoEvento, { texto: string; tono: "ok" | "aviso" | "mal" | "neutro" }> = {
  ALTA: { texto: "abrió su tienda", tono: "ok" },
  SUSPENDIDA: { texto: "fue suspendida", tono: "mal" },
  REACTIVADA: { texto: "fue reactivada", tono: "ok" },
  PLAN_CAMBIADO: { texto: "cambió de plan", tono: "neutro" },
  VIGENCIA_EXTENDIDA: { texto: "recibió más días", tono: "aviso" },
  MARCA_ACTUALIZADA: { texto: "actualizó su apariencia", tono: "neutro" },
  MARCA_RESTABLECIDA: { texto: "tuvo su marca restablecida", tono: "aviso" },
  PAGO_REGISTRADO: { texto: "pagó su suscripción", tono: "ok" },
}

export const TONO_PUNTO = {
  ok: "bg-emerald-500",
  aviso: "bg-amber-500",
  mal: "bg-rose-500",
  neutro: "bg-primary",
}
