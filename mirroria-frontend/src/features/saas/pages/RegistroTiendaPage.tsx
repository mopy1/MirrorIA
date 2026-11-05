import { Link, useSearchParams } from "react-router-dom"
import { AsistenteRegistro } from "../components/registro-tienda"
import { PLAN_DESTACADO } from "../lib/planes"

/** `/registro-tienda?plan=codigo` — alta de una tienda nueva (aprovisionamiento). */
export function RegistroTiendaPage() {
  const [params] = useSearchParams()
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link to="/planes" className="text-sm text-muted-foreground hover:text-foreground">
        ← Ver planes
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Creá tu tienda</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tres pasos. Al terminar entrás directo a tu panel para cargar tus prendas.</p>
      <div className="mt-8">
        <AsistenteRegistro planInicial={params.get("plan") ?? PLAN_DESTACADO} />
      </div>
    </section>
  )
}
