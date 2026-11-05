import { useState, type ReactNode } from "react"

interface Props {
  src: string | null | undefined
  alt: string
  className?: string
  /** Lo que se muestra si no hay URL o si falla la carga (monograma, foto genérica...). */
  respaldo: ReactNode
  prioritaria?: boolean
}

/** `<img>` de marca con las reglas de §A.5: sin referrer, carga diferida y respaldo ante error. */
export function ImagenMarca({ src, alt, className, respaldo, prioritaria }: Props) {
  const [fallo, setFallo] = useState<string | null>(null)
  if (!src || fallo === src) return <>{respaldo}</>
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      decoding="async"
      loading={prioritaria ? "eager" : "lazy"}
      fetchPriority={prioritaria ? "high" : "auto"}
      onError={() => setFallo(src)}
    />
  )
}
