import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "cn"
import type { Dispositivo } from "./tipos"

const ANCHO_BASE: Record<Dispositivo, number> = { escritorio: 1280, celular: 390 }

/**
 * Marco que dibuja la mini tienda a su ancho real (1280 o 390 px) y la escala
 * con `transform` al ancho disponible: así las proporciones son las de verdad.
 */
export function MarcoDispositivo({ dispositivo, children, className }: { dispositivo: Dispositivo; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [caja, setCaja] = useState({ ancho: 0, alto: 0 })
  const base = ANCHO_BASE[dispositivo]

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setCaja({ ancho: el.clientWidth, alto: el.clientHeight })
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const escala = caja.ancho > 0 ? caja.ancho / base : 0
  return (
    <div
      ref={ref}
      aria-label="Vista previa de tu tienda"
      role="img"
      className={cn(
        "relative overflow-hidden border border-border/70 bg-muted shadow-[0_18px_40px_-24px_oklch(0.21_0.05_277/0.45)]",
        dispositivo === "escritorio" ? "aspect-[16/10] w-full rounded-xl" : "mx-auto aspect-[9/19] w-full max-w-[300px] rounded-[2rem] border-[6px] border-foreground/85",
        className,
      )}
    >
      {escala > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 origin-top-left select-none"
          style={{ width: base, height: caja.alto / escala, transform: `scale(${escala})` }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
