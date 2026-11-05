import { CreditCard, Storefront, TShirt, type Icon } from "@phosphor-icons/react"

const PASOS: { icono: Icon; titulo: string; texto: string }[] = [
  {
    icono: CreditCard,
    titulo: "Elegí tu plan",
    texto: "Básico, Crecimiento o Cadena según cuántas sucursales y prendas manejás. Probás 14 días gratis.",
  },
  {
    icono: Storefront,
    titulo: "Creá tu tienda",
    texto: "Nombre, dirección propia (mirroria.app/t/tu-marca) y tu primera sucursal. Ya viene con tallas, colores y categorías.",
  },
  {
    icono: TShirt,
    titulo: "Vendé",
    texto: "Cargá tus prendas y compartí el link: tus clientas se las prueban con IA, reservan y pagan por QR.",
  },
]

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="scroll-mt-20 border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">Cómo funciona</p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight">Tres pasos y tu marca ya tiene tienda.</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {PASOS.map((paso, i) => (
            <li key={paso.titulo} className="rounded-2xl border border-border/60 bg-card p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <paso.icono className="size-5" />
                </span>
                <span className="text-4xl font-semibold text-muted-foreground/30">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-medium">{paso.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
