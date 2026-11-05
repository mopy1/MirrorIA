import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEstadoCobroSuscripcion } from "../hooks/useEstadoCobroSuscripcion"
import type { CobroSuscripcionResponseDto } from "../types/suscripcion.types"
import { CobroQrContenido } from "./cobro-qr-contenido"

interface CobroQrDialogProps {
  cobro: CobroSuscripcionResponseDto | null
  onCerrar: () => void
  onExito: () => void
}

export function CobroQrDialog({ cobro, onCerrar, onExito }: CobroQrDialogProps) {
  const open = Boolean(cobro)
  const { pagado, isLoadingSimulacion, error, simularPago } = useEstadoCobroSuscripcion(
    cobro?.cobroId ?? null,
  )

  useEffect(() => {
    if (pagado) {
      const timer = setTimeout(() => {
        onExito()
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [pagado, onExito])

  return (
    <Dialog open={open} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar con QR Simple</DialogTitle>
          <DialogDescription>
            Interoperable con cualquier entidad financiera del sistema nacional.
          </DialogDescription>
        </DialogHeader>

        {cobro && (
          <CobroQrContenido
            cobro={cobro}
            pagado={pagado}
            isLoadingSimulacion={isLoadingSimulacion}
            error={error}
            simularPago={simularPago}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCerrar} disabled={pagado}>
            {pagado ? "Cerrando..." : "Cancelar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
