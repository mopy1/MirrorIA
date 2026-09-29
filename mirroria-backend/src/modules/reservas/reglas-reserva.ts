/**
 * Reglas anti-acaparamiento de reservas (2026-09-29). Reservar es gratis, así
 * que sin estos topes una sola cuenta podía apartar todo el stock de una
 * variante, para cualquier fecha futura, y la prenda quedaba bloqueada hasta
 * que alguien del staff la liberara a mano. Ninguna necesita columnas nuevas:
 * se calculan con `reservas`, `reserva_items` e `inventario_sucursal`.
 *
 * `GET /reservas/mias/cupo` expone estos mismos valores a web y móvil para que
 * la interfaz no ofrezca lo que el backend va a rechazar.
 */
export const REGLAS_RESERVA = {
  /** Una reserva es para probarse, no para acopiar: 1 unidad por talla/color. */
  maxUnidadesPorVariante: 1,
  /** Prendas distintas por reserva. */
  maxPrendasPorReserva: 3,
  /** Reservas vivas (PENDIENTE, CONFIRMADA, EN_TIENDA) por clienta. */
  maxReservasActivas: 2,
  /** No se reserva "para ya": la tienda necesita tiempo para apartarla. */
  anticipacionMinimaMinutos: 30,
  /** Ni para dentro de un mes: el stock no puede quedar congelado. */
  ventanaMaximaHoras: 48,
  /** Pasada la hora elegida + esta tolerancia, la reserva vence sola. */
  toleranciaMinutos: 30,
  /** Faltas (EXPIRADA / NO_SHOW) dentro de `ventanaFaltasDias` que bloquean. */
  faltasParaBloqueo: 2,
  ventanaFaltasDias: 30,
  /** Días sin poder reservar, contados desde la última falta. */
  diasDeBloqueo: 30,
  /**
   * Parte del stock libre de cada variante/sucursal que se puede tener
   * reservada a la vez (redondeando hacia arriba, así la última unidad sí se
   * puede reservar). El resto queda siempre para la venta directa.
   */
  fraccionReservable: 0.5,
  /**
   * Una reserva EN_TIENDA sin venta (se probó y no compró) se cierra sola
   * pasadas estas horas desde la hora prevista, para liberar el stock. No
   * cuenta como falta: la clienta sí vino.
   */
  horasMaximasEnTienda: 4,
} as const;

/** Cada cuánto corre la barrida automática de reservas vencidas. */
export const MINUTOS_ENTRE_BARRIDAS = 5;
