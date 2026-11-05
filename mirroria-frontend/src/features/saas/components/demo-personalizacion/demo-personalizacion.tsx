import { Link } from "react-router-dom"
import { VistaPreviaTienda } from "@/components/marca/vista-previa"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { useDemoMarca } from "../../hooks/useDemoMarca"
import { DemoControles } from "./demo-controles"

/** "Cada tienda, su marca": el visitante cambia la marca de una tienda ficticia y la ve en vivo. */
export function DemoPersonalizacion() {
  const d = useDemoMarca()
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <div>
          <h2 className="max-w-[18ch] text-3xl font-bold tracking-tight text-balance sm:text-4xl">Cada tienda, su marca.</h2>
          <p className="mt-3 max-w-[44ch] text-muted-foreground">Probá cómo se vería la tuya. Lo mismo hacés después desde tu panel.</p>
          <div className="mt-8"><DemoControles d={d} /></div>
          <Link to={`/registro-tienda?paleta=${d.paleta}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-8 h-11 px-5")}>
            Empezar con estos colores
          </Link>
        </div>
        <VistaPreviaTienda marca={d.marca} nombre="Tu tienda" dispositivo="escritorio" />
      </div>
    </section>
  )
}
