export type EstadoRegreso = "confirmando" | "pagado" | "pendiente" | "rechazado" | "error"

interface AvisoRegreso {
  tono: "exito" | "info" | "error"
  texto: string
  reintentable: boolean
}

/**
 * La pasarela vuelve con `?pago=exito&cobro=<id>`, pero esa URL se puede
 * escribir a mano: solo el backend, preguntándole a la pasarela, sabe si se
 * pagó. Sin `cobro` es el QR, que ya se confirmó por sondeo antes de llegar.
 */
export function estadoInicialRegreso(pago: string | null, cobroId: string | null): EstadoRegreso | null {
  if (pago !== "exito") return null
  return cobroId ? "confirmando" : "pagado"
}

/**
 * Dos confirmaciones a la vez (StrictMode, doble pestaña) pueden volver cruzadas:
 * PayPal le contesta a una que la captura ya está en curso, y esa no debe pisar
 * el pago que la otra ya confirmó.
 */
export function siguienteEstado(
  actual: EstadoRegreso | null,
  respuesta: { pagado: boolean; estado: string },
): EstadoRegreso {
  if (respuesta.pagado || actual === "pagado") return "pagado"
  return respuesta.estado === "RECHAZADO" ? "rechazado" : "pendiente"
}

const AVISOS: Record<EstadoRegreso, AvisoRegreso> = {
  confirmando: { tono: "info", texto: "Estamos confirmando tu pago con la pasarela…", reintentable: false },
  pagado: {
    tono: "exito",
    texto: "¡Tu pago fue acreditado con éxito! Tu suscripción fue renovada y tu tienda continúa activa.",
    reintentable: false,
  },
  pendiente: {
    tono: "info",
    texto: "Todavía no vemos tu pago confirmado. Si ya pagaste, puede tardar unos minutos.",
    reintentable: true,
  },
  rechazado: { tono: "error", texto: "La pasarela rechazó el pago. No se te cobró: probá con otro medio.", reintentable: false },
  error: { tono: "error", texto: "No pudimos consultar tu pago. Probá de nuevo en unos segundos.", reintentable: true },
}

export function avisoDeRegreso(estado: EstadoRegreso): AvisoRegreso {
  return AVISOS[estado]
}
