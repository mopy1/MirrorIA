import { PaintBrush, QrCode, Tag, type Icon } from "@phosphor-icons/react"

const PASOS: { icono: Icon; titulo: string; texto: string }[] = [
  { icono: Tag, titulo: "Elegí tu plan", texto: "Básico, Crecimiento o Cadena según tus sucursales y prendas. Los primeros 14 días no pagás." },
  { icono: PaintBrush, titulo: "Poné tu marca", texto: "Tu logo, tus colores, tus fotos y tu dirección propia: /t/tu-marca." },
  { icono: QrCode, titulo: "Vendé y cobrá", texto: "Cargá tus prendas y compartí el link. Tus clientas reservan, se prueban y pagan por QR." },
]

/** Lista vertical de 3 filas grandes con verbo (sin "Paso 1/2/3"). */
export function ComoFunciona() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-muted/50 py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <h2 className="max-w-[14ch] text-3xl font-bold tracking-tight text-balance sm:text-4xl">Tu tienda abierta en una tarde.</h2>
        <ol className="divide-y divide-border">
          {PASOS.map((p) => (
            <li key={p.titulo} className="flex gap-5 py-6 first:pt-0 last:pb-0">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <p.icono className="size-6" />
              </span>
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{p.titulo}</h3>
                <p className="mt-1.5 max-w-[52ch] text-muted-foreground">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
