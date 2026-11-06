import { useId } from "react"
import { Sparkle } from "@phosphor-icons/react"

/** La conclusión de la IA: lo único que hay que leer. Banda tintada a todo el ancho del lienzo (no una tarjeta). */
export function ConclusionReporte({ texto }: { texto: string }) {
  const idTitulo = useId()
  return (
    <section aria-labelledby={idTitulo} className="bg-primary/[0.05] px-4 py-5 sm:px-7">
      <h3 id={idTitulo} className="flex items-center gap-1.5 text-sm font-semibold text-primary">
        <Sparkle className="size-4" weight="fill" aria-hidden />
        Conclusión
      </h3>
      <p className="mt-2 max-w-[68ch] text-base leading-relaxed font-medium text-pretty text-foreground sm:text-lg sm:leading-relaxed">
        {texto}
      </p>
    </section>
  )
}
