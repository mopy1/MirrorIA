import type { ReactNode } from "react"
import { CircleNotch, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AccionDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  titulo: string
  descripcion: string
  confirmar: string
  destructivo?: boolean
  isLoading: boolean
  error: string | null
  deshabilitado?: boolean
  onConfirmar: () => void
  children?: ReactNode
}

/** Esqueleto común de los diálogos de acción de la plataforma (spinner + error del backend). */
export function AccionDialog(p: AccionDialogProps) {
  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{p.titulo}</DialogTitle>
          <DialogDescription>{p.descripcion}</DialogDescription>
        </DialogHeader>
        {p.children}
        {p.error && (
          <Alert variant="destructive">
            <WarningCircle weight="fill" />
            <AlertDescription>{p.error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => p.onOpenChange(false)}>Cancelar</Button>
          <Button variant={p.destructivo ? "destructive" : "default"} onClick={p.onConfirmar} disabled={p.isLoading || p.deshabilitado} className="gap-2">
            {p.isLoading && <CircleNotch className="size-4 animate-spin" />}
            {p.confirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
