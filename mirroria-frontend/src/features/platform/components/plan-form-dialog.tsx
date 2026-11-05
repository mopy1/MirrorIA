import { useState } from "react"
import { CircleNotch, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCreateResource } from "@/hooks/useCreateResource"
import { plataformaApi } from "../api/plataformaApi"
import { dtoDesdeForm, errorPlanForm, formDesdePlan } from "../lib/plan-form"
import type { PlanDto } from "../types/plataforma.types"
import { PlanFormFields } from "./plan-form-fields"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  plan: PlanDto | null // null = crear
  onGuardado: () => void
}

/** Crear o editar un plan (el padre lo remonta al abrir con `key`). */
export function PlanFormDialog({ open, onOpenChange, plan, onGuardado }: Props) {
  const creando = plan === null
  const [form, setForm] = useState(() => formDesdePlan(plan))
  const [local, setLocal] = useState<string | null>(null)
  const { submit, isLoading, error } = useCreateResource(() => {
    const { codigo, ...resto } = dtoDesdeForm(form)
    return creando ? plataformaApi.crearPlan({ codigo, ...resto }) : plataformaApi.actualizarPlan(plan.id, resto)
  })

  async function guardar() {
    const problema = errorPlanForm(form, creando)
    setLocal(problema)
    if (problema) return
    if (await submit(undefined)) {
      onGuardado()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{creando ? "Nuevo plan" : `Editar ${plan.nombre}`}</DialogTitle>
          <DialogDescription>Los cambios de precio no afectan a las suscripciones ya creadas (el precio queda congelado).</DialogDescription>
        </DialogHeader>
        <PlanFormFields form={form} creando={creando} onChange={(c, v) => setForm((f) => ({ ...f, [c]: v }))} onExtra={(c) => setForm((f) => ({ ...f, ...c }))} />
        {(local ?? error) && (
          <Alert variant="destructive">
            <WarningCircle weight="fill" />
            <AlertDescription>{local ?? error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={guardar} disabled={isLoading} className="gap-2">
            {isLoading && <CircleNotch className="size-4 animate-spin" />}
            {creando ? "Crear plan" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
