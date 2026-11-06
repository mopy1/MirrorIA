import { CalendarCheck, CoatHanger, Receipt, UsersThree, type Icon } from "@phosphor-icons/react"
import type { TemaSugerencia } from "../../lib/inicio-sugerencias"

/** Ícono de cada tema de preguntas (lo comparten el inicio y el chat vacío). */
export const ICONO_TEMA: Record<TemaSugerencia, Icon> = {
  ventas: Receipt,
  productos: CoatHanger,
  reservas: CalendarCheck,
  personas: UsersThree,
}
