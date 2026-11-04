import { CheckCircle, Lightning, MagnifyingGlass, Package, Sparkle } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import type { PasoEjecutado } from "../../types/reports-hybrid.types"

interface ReasoningStepsProps {
  pasos: PasoEjecutado[]
}

const TOOL_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  consultar_metricas: {
    label: "Consultó métricas históricas",
    icon: MagnifyingGlass,
  },
  consultar_proveedores_stock: {
    label: "Cruzó órdenes con proveedores",
    icon: Package,
  },
  simular_what_if: {
    label: "Simuló proyección en DuckDB",
    icon: Lightning,
  },
}

export function ReasoningSteps({ pasos }: ReasoningStepsProps) {
  if (!pasos || pasos.length === 0) return null

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Sparkle className="size-3.5 text-primary" weight="fill" />
        <span>Razonamiento agéntico ({pasos.length} pasos)</span>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        {pasos.map((paso) => {
          const config = TOOL_CONFIG[paso.herramienta] ?? {
            label: paso.herramienta,
            icon: CheckCircle,
          }
          const Icon = config.icon

          return (
            <div
              key={paso.paso}
              className="flex items-start gap-2.5 rounded-md bg-background/80 p-2 text-xs border border-border/50"
            >
              <Badge
                variant="secondary"
                className="size-5 shrink-0 items-center justify-center rounded-full p-0 text-[10px] font-mono"
              >
                {paso.paso}
              </Badge>
              <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{config.label}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {paso.resultadoResumen}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
