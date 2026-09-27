import { Camera } from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { EscenaProbador } from "../components/escena-probador"
import { PanelGuiado } from "../components/panel-guiado"
import { RespaldoSinCamara } from "../components/respaldo-sin-camara"
import { TiraDePrendas } from "../components/tira-de-prendas"
import { useProbador } from "../hooks/useProbador"

export function ProbadorPage() {
  const { productoId } = useParams()
  const {
    estado, reintentar, stream, remoto, setVideo,
    pasos, aviso, prenda, probables, fallidas,
    aplicarPrenda, sacarFoto, enlaceDescarga,
  } = useProbador(productoId)

  return (
    /* El orden del DOM es el del CELULAR, que es el caso de uso principal
       (el propio mensaje de error dice "Probá desde el celular"): primero
       los pasos que guían a la clienta, después la cámara y la tira, y al
       final los botones. En pantallas grandes las tres piezas se
       recolocan con `lg:col-start-*`/`lg:row-start-*`. */
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_20rem] lg:grid-rows-[auto_1fr]">
      <aside className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
        <h1 className="text-2xl font-semibold tracking-tight">Probador virtual</h1>
        <PanelGuiado pasos={pasos} />
        {aviso && <p className="text-sm text-destructive">{aviso}</p>}
      </aside>

      {/* min-w-0: sin esto el <video> reporta su ancho intrínseco (el de la
          cámara) y esta columna empuja el documento entero con scroll
          horizontal apenas la cámara está activa. */}
      <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:row-span-2">
        {estado === "lista" ? (
          <EscenaProbador stream={stream} remoto={remoto} onVideo={setVideo} />
        ) : estado === "pidiendo" ? (
          <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-secondary" />
        ) : (
          <RespaldoSinCamara
            estado={estado}
            urlPrenda={prenda?.imagenes?.[0]?.url ?? null}
            idProducto={prenda?.id ?? null}
            onReintentar={reintentar}
          />
        )}
        <div className="mt-4">
          <TiraDePrendas
            prendas={probables}
            elegidaId={prenda?.id ?? null}
            fallidas={fallidas}
            onElegir={aplicarPrenda}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:col-start-2 lg:row-start-2 lg:self-start">
        {estado === "lista" && (
          <button type="button" onClick={sacarFoto} className={cn(buttonVariants({ variant: "outline" }))}>
            <Camera />
            Sacar foto
          </button>
        )}
        {prenda && (
          <Link to={`/tienda/producto/${prenda.id}`} className={cn(buttonVariants())}>
            Reservar en sucursal
          </Link>
        )}

        {/* Ancla oculta: acá cae la descarga de la foto que arma `sacarFoto`. */}
        <a ref={enlaceDescarga} download="probador-mirroria.png" className="hidden">
          descarga
        </a>
      </div>
    </div>
  )
}
