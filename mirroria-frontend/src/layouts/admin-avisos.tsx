import { useEffect, useState } from "react"
import { Confetti, HourglassMedium, Warning } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { EVENTO_TIENDA_NO_DISPONIBLE } from "@/lib/api"
import { borrarBienvenida, leerBienvenida } from "@/lib/bienvenida"
import type { SuscripcionDto } from "@/types/plan.types"
import { cn } from "cn"

const TONOS = {
  rojo: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  ambar: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  verde: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
}

function Aviso({ tono, children, conLink }: { tono: keyof typeof TONOS; children: React.ReactNode; conLink: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-sm sm:px-8", TONOS[tono])}>
      <span className="flex items-center gap-2 [&_svg]:size-4">{children}</span>
      {conLink && (
        <Link to="/admin/suscripcion" className="font-medium underline underline-offset-4">
          Ver mi plan
        </Link>
      )}
    </div>
  )
}

/**
 * Banners del panel (spec §7.2): bienvenida tras el alta, prueba por vencer
 * (≤ 3 días) y tienda no disponible (cualquier 403 "no está disponible").
 */
export function AdminAvisos({ suscripcion, esAdmin }: { suscripcion: SuscripcionDto | null; esAdmin: boolean }) {
  const [bienvenida] = useState(leerBienvenida)
  const [noDisponible, setNoDisponible] = useState(false)

  // Se muestra solo en este montaje del layout: al recargar ya no está.
  useEffect(borrarBienvenida, [])

  useEffect(() => {
    const marcar = () => setNoDisponible(true)
    window.addEventListener(EVENTO_TIENDA_NO_DISPONIBLE, marcar)
    return () => window.removeEventListener(EVENTO_TIENDA_NO_DISPONIBLE, marcar)
  }, [])

  const vencida = suscripcion && (suscripcion.estado === "VENCIDA" || suscripcion.diasRestantes === 0)
  if (noDisponible || vencida) {
    return <Aviso tono="rojo" conLink={esAdmin}><Warning weight="fill" /> Tu tienda está suspendida o vencida: tus clientas no pueden comprar.</Aviso>
  }
  if (bienvenida !== null) {
    return <Aviso tono="verde" conLink={esAdmin}><Confetti weight="fill" /> Tu tienda está lista: probá {bienvenida} días gratis. Empezá cargando tu primera prenda.</Aviso>
  }
  if (suscripcion?.estado === "TRIAL" && suscripcion.diasRestantes <= 3) {
    return <Aviso tono="ambar" conLink={esAdmin}><HourglassMedium weight="fill" /> Te quedan {suscripcion.diasRestantes} días de prueba.</Aviso>
  }
  return null
}
