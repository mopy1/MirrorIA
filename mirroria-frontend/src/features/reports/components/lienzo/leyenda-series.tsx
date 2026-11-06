interface Serie {
  nombre: string
  /** Clase de fondo de la muestra (token del tema). */
  muestra: string
}

/** Leyenda de 2 series: identidad nunca solo por color (muestra + nombre en texto). */
export function LeyendaSeries({ series }: { series: Serie[] }) {
  return (
    <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
      {series.map((s) => (
        <li key={s.nombre} className="flex items-center gap-2">
          <span className={`h-2 w-4 rounded-full ${s.muestra}`} aria-hidden />
          {s.nombre}
        </li>
      ))}
    </ul>
  )
}
