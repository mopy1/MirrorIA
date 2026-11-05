import { Link, useSearchParams } from "react-router-dom"
import { AsistenteRegistro } from "../components/registro-tienda"
import { esPaleta } from "@/lib/tema/marca.constants"
import { PLAN_DESTACADO } from "../lib/planes"

/** `/registro-tienda?plan=codigo&paleta=codigo` — alta de una tienda nueva (la demo de la landing preselecciona la paleta). */
export function RegistroTiendaPage() {
  const [params] = useSearchParams()
  const paleta = params.get("paleta")
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link to="/planes" className="text-sm text-muted-foreground hover:text-foreground">
        ← Ver planes
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Creá tu tienda</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tres pasos. Al terminar entrás a tu panel para darle tu estilo y cargar tus prendas.</p>
      <div className="mt-8">
        <AsistenteRegistro planInicial={params.get("plan") ?? PLAN_DESTACADO} paletaInicial={esPaleta(paleta) ? paleta : undefined} />
      </div>
    </section>
  )
}
