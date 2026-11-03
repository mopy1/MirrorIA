import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { AvisoCobro } from "../components/aviso-cobro"
import { ComprobanteWayraVista } from "../components/comprobante-wayra"
import { PasoCobro } from "../components/paso-cobro"
import { TecladoPin } from "../components/teclado-pin"
import { WayraBoton, WayraLogo, WayraShell } from "../components/wayra-marca"
import { useWayraPago } from "../hooks/useWayraPago"

/**
 * Lo que se abre en el celular al escanear el QR de cobro de MirrorIA: la app
 * del banco (ficticio) Wayra. Pública: quien paga no tiene cuenta en la tienda.
 */
export function WayraPagoPage() {
  const { token } = useParams<{ token: string }>()
  const w = useWayraPago(token)

  // Es la app del banco, no la tienda: la pestaña no puede decir "MirrorIA".
  useEffect(() => {
    const anterior = document.title
    document.title = "Wayra · Banca móvil"
    return () => {
      document.title = anterior
    }
  }, [])

  if (w.paso === "cargando") {
    return (
      <WayraShell>
        <div className="flex flex-1 items-center justify-center text-[#2453C9]">
          <WayraLogo className="size-14 motion-safe:animate-pulse" />
          <span className="sr-only">Abriendo el cobro…</span>
        </div>
      </WayraShell>
    )
  }

  if (w.paso === "no-encontrado" || !w.cobro) {
    return (
      <WayraShell>
        <AvisoCobro cobro={null} />
      </WayraShell>
    )
  }

  if (w.paso === "pin" || w.paso === "procesando") {
    return (
      <WayraShell>
        <TecladoPin
          montoCents={w.cobro.montoCents}
          comercio={w.cobro.comercio}
          procesando={w.paso === "procesando"}
          onCompleto={w.confirmarPin}
          onCancelar={w.volver}
        />
      </WayraShell>
    )
  }

  if (w.paso === "comprobante" && w.comprobante) {
    return (
      <WayraShell accion={<WayraBoton onClick={w.terminar}>Listo</WayraBoton>}>
        <ComprobanteWayraVista comprobante={w.comprobante} />
      </WayraShell>
    )
  }

  if (w.cobro.estado !== "PENDIENTE") {
    return (
      <WayraShell>
        <AvisoCobro cobro={w.cobro} />
      </WayraShell>
    )
  }

  return (
    <WayraShell
      accion={
        <WayraBoton onClick={w.continuar} disabled={!w.cuentaId}>
          Continuar
        </WayraBoton>
      }
    >
      <PasoCobro cobro={w.cobro} cuentaId={w.cuentaId} onCuenta={w.setCuentaId} error={w.error} />
    </WayraShell>
  )
}
