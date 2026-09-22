import { useLocation } from "react-router-dom"
import { InstruccionesPago } from "../components/instrucciones-pago"
import { RegresoPasarela } from "../components/regreso-pasarela"

export function PagoPage() {
  const location = useLocation()

  if (location.pathname === "/pago/exito" || location.pathname === "/pago/cancelado") {
    return <RegresoPasarela cancelado={location.pathname === "/pago/cancelado"} />
  }

  return <InstruccionesPago />
}
