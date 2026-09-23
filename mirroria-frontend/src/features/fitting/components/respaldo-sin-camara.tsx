import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import type { EstadoCamara } from "../hooks/useCamara"

const MOTIVO: Record<string, string> = {
  denegada: "No nos diste permiso para usar la cámara, o se lo revocaste. Podés habilitarla desde el candado de la barra de direcciones y volver a intentar.",
  "sin-camara": "No encontramos una cámara en este equipo. Probá desde el celular.",
  "no-soportada": "Este navegador no puede abrir la cámara. Probá con Chrome, Edge o Safari actualizados.",
}

export function RespaldoSinCamara({
  estado,
  urlPrenda,
  idProducto,
  onReintentar,
}: {
  estado: EstadoCamara
  urlPrenda: string | null
  idProducto: string | null
  onReintentar: () => void
}) {
  return (
    <div className="rounded-2xl bg-secondary p-8 text-center">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-xs">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-foreground/10 to-transparent" />
        {urlPrenda && (
          <img
            src={urlPrenda}
            alt=""
            // Esta es la pantalla de quien ya falló una vez (sin cámara, sin
            // permiso): si además el PNG de la prenda no carga, un ícono roto
            // es peor que nada. Se esconde y queda el degradado.
            onError={(e) => {
              e.currentTarget.hidden = true
            }}
            className="absolute inset-0 m-auto max-h-full object-contain"
          />
        )}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">{MOTIVO[estado]}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onReintentar} className={cn(buttonVariants())}>
          Reintentar
        </button>
        {idProducto && (
          <Link to={`/tienda/producto/${idProducto}`} className={cn(buttonVariants({ variant: "outline" }))}>
            Reservala en sucursal
          </Link>
        )}
      </div>
    </div>
  )
}
