import { Check } from "@phosphor-icons/react"
import { cn } from "cn"

export function Stepper({ pasos, actual }: { pasos: readonly string[]; actual: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Pasos del registro">
      {pasos.map((paso, i) => {
        const hecho = i < actual
        const activo = i === actual
        return (
          <li key={paso} className="flex flex-1 items-center gap-2" aria-current={activo ? "step" : undefined}>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                hecho && "border-primary bg-primary text-primary-foreground",
                activo && "border-primary bg-primary/10 text-primary",
                !hecho && !activo && "border-border text-muted-foreground",
              )}
            >
              {hecho ? <Check weight="bold" className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("hidden text-sm sm:block", activo ? "font-medium text-foreground" : "text-muted-foreground")}>{paso}</span>
            {i < pasos.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        )
      })}
    </ol>
  )
}
