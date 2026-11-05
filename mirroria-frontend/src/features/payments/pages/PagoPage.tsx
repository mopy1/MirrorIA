import { useLocation, useSearchParams } from "react-router-dom"
import { InstruccionesPago } from "../components/instrucciones-pago"
import { PagoQr } from "../components/pago-qr"
import { RegresoPasarela } from "../components/regreso-pasarela"

export function PagoPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  if (location.pathname.endsWith("/pago/exito") || location.pathname.endsWith("/pago/cancelado")) {
    return <RegresoPasarela cancelado={location.pathname.endsWith("/pago/cancelado")} />
  }

  if (searchParams.get("metodo") === "QR") {
    return <PagoQr />
  }

  return <InstruccionesPago />
}
