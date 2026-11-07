import { Switch } from "@/components/ui/switch"

/** Solo para la demo/defensa: fuerza el modo offline sin apagar el Wi-Fi. */
export function InterruptorSinRed({ activo, onChange }: { activo: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border p-3">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">Simular sin red</span>
        <span className="text-[11px] text-muted-foreground">
          Modo demo: nada sale a internet; lo que hagas queda en esta cola hasta apagarlo.
        </span>
      </span>
      <Switch checked={activo} onCheckedChange={(v) => onChange(Boolean(v))} aria-label="Simular sin red" />
    </label>
  )
}
