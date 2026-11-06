export type TonoCita = "bien" | "atencion" | "mal" | "neutro"

export interface EtiquetaCita {
  etiqueta: string
  tono: TonoCita
}

const ESTADOS_POR_LLEGAR = ["PENDIENTE", "CONFIRMADA"]

/** Minutos desde la medianoche para una hora "HH:MM". */
function minutosDelDia(hora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hora)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** La cita todavía no llegó y ya pasaron más de `tolerancia` minutos de su hora. */
export function pasoLaHora(estado: string, horaPrevista: string, ahora: Date, tolerancia = 15): boolean {
  if (!ESTADOS_POR_LLEGAR.includes(estado)) return false
  const cita = minutosDelDia(horaPrevista)
  if (cita === null) return false
  return ahora.getHours() * 60 + ahora.getMinutes() > cita + tolerancia
}

/** Estado en palabras (nunca `EN_TIENDA` o `EXPIRADA` crudos). */
export function estadoCita(estado: string, horaPrevista: string, ahora: Date): EtiquetaCita {
  if (pasoLaHora(estado, horaPrevista, ahora)) return { etiqueta: "Pasó la hora", tono: "atencion" }
  switch (estado) {
    case "PENDIENTE":
      return { etiqueta: "Pendiente", tono: "neutro" }
    case "CONFIRMADA":
      return { etiqueta: "Confirmada", tono: "neutro" }
    case "EN_TIENDA":
      return { etiqueta: "Ya llegó", tono: "bien" }
    case "COMPLETADA":
      return { etiqueta: "Completada", tono: "bien" }
    case "CANCELADA":
      return { etiqueta: "Cancelada", tono: "neutro" }
    case "EXPIRADA":
    case "NO_SHOW":
      return { etiqueta: "No vino", tono: "mal" }
    default:
      return { etiqueta: "Sin estado", tono: "neutro" }
  }
}

export function estaPorLlegar(estado: string): boolean {
  return ESTADOS_POR_LLEGAR.includes(estado)
}

/**
 * "¿Vendrá?" a partir de la probabilidad de que falte (0-1 o 0-100).
 * Sin dato o si la clienta ya llegó/se cerró la cita, no se pronostica nada.
 */
export function pronosticoAsistencia(estado: string, probabilidadNoShow?: number): EtiquetaCita | null {
  if (!estaPorLlegar(estado) || probabilidadNoShow === undefined || Number.isNaN(probabilidadNoShow)) return null
  const p = probabilidadNoShow > 1 ? probabilidadNoShow / 100 : probabilidadNoShow
  // Mismos cortes que Predicciones (35 % / 65 %): las dos vistas dicen lo mismo de la misma cita.
  if (p < 0.35) return { etiqueta: "Seguro", tono: "bien" }
  if (p < 0.65) return { etiqueta: "Puede faltar", tono: "atencion" }
  return { etiqueta: "Probable que falte", tono: "mal" }
}

/** Link de WhatsApp para reconfirmar la cita (Bolivia, +591). */
export function linkReconfirmar(nombre: string, telefono: string | null, hora: string): string | null {
  const tel = telefono?.replace(/\D/g, "")
  if (!tel) return null
  const numero = tel.startsWith("591") ? tel : `591${tel}`
  const texto = `Hola ${nombre}, te escribimos para confirmar tu cita de hoy a las ${hora}. ¿Seguís pudiendo venir?`
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}
