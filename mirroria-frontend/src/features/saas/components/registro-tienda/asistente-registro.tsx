import type { FormEvent } from "react"
import { ArrowLeft, ArrowRight, CircleNotch, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useDisponibilidadSlug } from "../../hooks/useDisponibilidadSlug"
import { usePlanes } from "../../hooks/usePlanes"
import { useRegistrarTienda } from "../../hooks/useRegistrarTienda"
import { PASOS, useRegistroTiendaForm } from "../../hooks/useRegistroTiendaForm"
import { PasoCuenta } from "./paso-cuenta"
import { PasoPlan } from "./paso-plan"
import { PasoTienda } from "./paso-tienda"
import { ResumenRegistro } from "./resumen-registro"
import { Stepper } from "./stepper"

/** Asistente Plan → Tienda y sucursal → Cuenta (`POST /saas/tiendas`). */
export function AsistenteRegistro({ planInicial }: { planInicial: string }) {
  const { planes, isLoading: cargandoPlanes } = usePlanes()
  const f = useRegistroTiendaForm(planInicial)
  const estadoSlug = useDisponibilidadSlug(f.form.tienda.slug)
  const { registrar, isLoading, error } = useRegistrarTienda()
  const plan = planes.find((p) => p.codigo === f.form.planCodigo)
  const ultimo = f.paso === PASOS.length - 1
  const slugBloquea = f.paso === 1 && (estadoSlug.tipo === "no-disponible" || estadoSlug.tipo === "verificando")

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (slugBloquea) return
    if (f.avanzar() && ultimo) await registrar(f.dto())
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form onSubmit={onSubmit} className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <Stepper pasos={PASOS} actual={f.paso} />
        <h2 className="mt-8 text-xl font-semibold">{PASOS[f.paso]}</h2>
        <div className="mt-6">
          {f.paso === 0 && (
            <PasoPlan planes={planes} isLoading={cargandoPlanes} seleccionado={f.form.planCodigo} onSeleccionar={f.setPlan} error={f.errores.planCodigo} />
          )}
          {f.paso === 1 && (
            <PasoTienda form={f.form} errores={f.errores} estadoSlug={estadoSlug} onTienda={(c, v) => f.set("tienda", c, v)} onSucursal={(c, v) => f.set("sucursal", c, v)} />
          )}
          {f.paso === 2 && <PasoCuenta form={f.form} errores={f.errores} onAdmin={(c, v) => f.set("admin", c, v)} />}
        </div>
        {error && (
          <Alert variant="destructive" className="mt-6">
            <WarningCircle weight="fill" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={f.volver} disabled={f.paso === 0 || isLoading} className="gap-1.5">
            <ArrowLeft /> Atrás
          </Button>
          <Button type="submit" size="lg" disabled={isLoading || slugBloquea} className="gap-2">
            {isLoading && <CircleNotch className="size-4 animate-spin" />}
            {ultimo ? (isLoading ? "Creando tu tienda..." : "Crear mi tienda") : "Continuar"}
            {!ultimo && <ArrowRight weight="bold" />}
          </Button>
        </div>
      </form>
      <ResumenRegistro form={f.form} plan={plan} />
    </div>
  )
}
