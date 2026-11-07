import { CreditCard, Money, QrCode, type Icon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { usePasarelas } from "@/features/payments/hooks/usePasarelas"
import { iconoDePasarela } from "@/features/payments/lib/icono-pasarela"
import type { MetodoPago } from "@/features/payments/types/payments.types"

interface OpcionMetodo {
  value: MetodoPago
  label: string
  icon: Icon
  descripcion: string
}

const METODOS_DEFAULT: OpcionMetodo[] = [
  {
    value: "TARJETA",
    label: "Tarjeta",
    icon: CreditCard,
    descripcion: "Se paga en línea con tarjeta de crédito o débito.",
  },
  {
    value: "QR",
    label: "QR Simple",
    icon: QrCode,
    descripcion: "Al confirmar te mostramos un código QR para pagar desde tu app bancaria.",
  },
  {
    value: "EFECTIVO",
    label: "Efectivo",
    icon: Money,
    descripcion: "Al confirmar vas a ver las instrucciones para pagar al retirar en sucursal.",
  },
]

interface SelectorMetodoPagoProps {
  metodo: MetodoPago
  onChange: (metodo: MetodoPago) => void
}

export function SelectorMetodoPago({ metodo, onChange }: SelectorMetodoPagoProps) {
  const { pasarelas } = usePasarelas("checkout")

  // Deriva métodos dinámicamente si el backend devuelve pasarelas activas
  const metodos: OpcionMetodo[] = pasarelas.length > 0
    ? pasarelas
        .filter((p) => p.estado === "DISPONIBLE" && p.soportaCheckout)
        .map((p) => {
          const val: MetodoPago = p.tipo === "TARJETA" ? "TARJETA" : p.tipo === "QR" ? "QR" : "EFECTIVO"
          return {
            value: val,
            label: p.nombre,
            icon: iconoDePasarela(p.icono),
            descripcion: p.descripcion,
          }
        })
    : METODOS_DEFAULT

  const metodoActual = metodos.find((m) => m.value === metodo) ?? metodos[0]

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-2.5">
      <Label>Método de pago</Label>
      <div className="grid grid-cols-3 gap-2">
        {metodos.map(({ value, label, icon: IconComponent }) => (
          <Button
            key={value}
            type="button"
            variant={metodo === value ? "default" : "outline"}
            className="h-auto min-w-0 flex-col gap-1.5 px-2 py-3 text-center"
            aria-pressed={metodo === value}
            onClick={() => onChange(value)}
          >
            <IconComponent className="size-5 shrink-0" />
            <span className="w-full whitespace-normal text-xs leading-tight sm:text-sm">{label}</span>
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{metodoActual?.descripcion}</p>
    </div>
  )
}
