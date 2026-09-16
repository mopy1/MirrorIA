import { cn } from "cn"

interface VariantSwatchGroupProps {
  label: string
  options: { id: string; nombre: string }[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function VariantSwatchGroup({ label, options, selectedId, onSelect }: VariantSwatchGroupProps) {
  if (options.length === 0) return null
  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              "min-w-11 rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selectedId === option.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground hover:border-foreground/40"
            )}
          >
            {option.nombre}
          </button>
        ))}
      </div>
    </div>
  )
}
