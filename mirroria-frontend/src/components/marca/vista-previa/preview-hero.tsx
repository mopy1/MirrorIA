import { cn } from "cn"
import { ImagenMarca } from "../imagen-marca"
import type { PropsPreview } from "./tipos"

/** Portada de la mini tienda con la imagen y los textos del borrador. */
export function PreviewHero({ marca, celular }: PropsPreview) {
  const { hero } = marca
  return (
    <div className={cn("relative overflow-hidden bg-black", celular ? "h-[520px]" : "h-[460px]")}>
      <ImagenMarca
        src={hero.imagenUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[50%_25%]"
        respaldo={<div className="absolute inset-0 bg-muted" />}
      />
      <div className={cn("absolute inset-0", celular ? "bg-gradient-to-t from-black/90 via-black/35 to-transparent" : "bg-gradient-to-r from-black/85 via-black/45 to-transparent")} />
      <div className={cn("relative flex h-full flex-col", celular ? "justify-end p-6" : "justify-center px-14")}>
        <div className="max-w-[560px]">
          <h1 className={cn("leading-[1.08] font-semibold tracking-tight text-balance text-white", celular ? "text-[32px]" : "text-[52px]")}>
            {hero.titulo || "El título de tu portada"}
          </h1>
          {hero.subtitulo && <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-white/80">{hero.subtitulo}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium whitespace-nowrap text-primary-foreground">
              {hero.ctaTexto || "Ver catálogo"}
            </span>
            {hero.mostrarProbador && (
              <span className="inline-flex h-11 items-center rounded-lg border border-white/40 px-6 text-sm font-medium whitespace-nowrap text-white">
                Probátela ahora
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
