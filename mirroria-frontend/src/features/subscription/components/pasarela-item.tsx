import { Badge } from "@/components/ui/badge"
import type { IconoPasarela, PasarelaMetadata } from "@/features/payments/types/pasarelas.types"
import { CreditCard, Money, PaypalLogo, QrCode } from "@phosphor-icons/react"
import { cn } from "cn"

interface PasarelaItemProps {
  pasarela: PasarelaMetadata
  disabled?: boolean
  onClick: () => void
}

function PasarelaIcono({ icono, className }: { icono: IconoPasarela; className?: string }) {
  if (icono === "qr-code") return <QrCode className={className} />
  if (icono === "paypal-logo") return <PaypalLogo className={className} />
  if (icono === "money") return <Money className={className} />
  return <CreditCard className={className} />
}

export function PasarelaItem({ pasarela, disabled, onClick }: PasarelaItemProps) {
  const esOperativa = pasarela.estado === "DISPONIBLE" && !disabled

  return (
    <li>
      <button
        type="button"
        disabled={!esOperativa}
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-4 p-4 text-left transition-colors",
          esOperativa
            ? "cursor-pointer hover:bg-muted/50"
            : "cursor-not-allowed opacity-75",
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <PasarelaIcono icono={pasarela.icono} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{pasarela.nombre}</span>
          <span className="block text-sm text-muted-foreground">{pasarela.descripcion}</span>
        </span>
        {pasarela.estado !== "DISPONIBLE" && (
          <Badge
            variant="outline"
            className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            {pasarela.estado === "EN_DESARROLLO" ? "En desarrollo" : "Próximamente"}
          </Badge>
        )}
      </button>
    </li>
  )
}
