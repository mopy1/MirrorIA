// Ventana de horario válida para una reserva (espejo de las reglas del
// backend: fechaHoraPrevista entre ahora + anticipación mínima y ahora +
// ventana máxima). Puro y sin React para poder testearlo con vitest.

export const ANTICIPACION_MINIMA_DEFAULT = 30
export const VENTANA_MAXIMA_HORAS_DEFAULT = 48

interface ReglasVentana {
  anticipacionMinimaMinutos: number
  ventanaMaximaHoras: number
}

const dosDigitos = (n: number) => String(n).padStart(2, "0")

/** Formatea en hora LOCAL como lo espera `<input type="datetime-local">`. */
export function aDatetimeLocal(fecha: Date): string {
  return (
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
    `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
  )
}

/**
 * `min` se redondea al minuto siguiente: el input no tiene segundos, y
 * truncarlos dejaría el mínimo unos segundos antes de lo que acepta el
 * backend (→ 409).
 */
export function ventanaReserva(ahora: Date, reglas?: ReglasVentana | null) {
  const anticipacion = reglas?.anticipacionMinimaMinutos ?? ANTICIPACION_MINIMA_DEFAULT
  const horas = reglas?.ventanaMaximaHoras ?? VENTANA_MAXIMA_HORAS_DEFAULT
  const min = new Date(ahora.getTime() + anticipacion * 60_000)
  if (min.getSeconds() > 0 || min.getMilliseconds() > 0) {
    min.setSeconds(0, 0)
    min.setMinutes(min.getMinutes() + 1)
  }
  const max = new Date(ahora.getTime() + horas * 3_600_000)
  return { min: aDatetimeLocal(min), max: aDatetimeLocal(max) }
}

/** Compara strings `YYYY-MM-DDTHH:mm` (el orden lexicográfico coincide con el cronológico). */
export function estaEnVentana(valor: string, ventana: { min: string; max: string }): boolean {
  return valor >= ventana.min && valor <= ventana.max
}
