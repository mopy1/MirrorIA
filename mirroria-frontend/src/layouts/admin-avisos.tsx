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

type Enlace = { to: string; label: string } | null

function Aviso({ tono, children, enlace }: { tono: keyof typeof TONOS; children: React.ReactNode; enlace: Enlace }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-sm sm:px-8", TONOS[tono])}>
      <span className="flex items-center gap-2 [&_svg]:size-4">{children}</span>
      {enlace && (
        <Link to={enlace.to} className="font-medium underline underline-offset-4">
          {enlace.label}
        </Link>
      )}
    </div>
  )
}

/**
 * Banners del panel (spec Fase 1 §7.2 + 1b §E.4): bienvenida tras el alta (cae en Apariencia), prueba por vencer
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

  const activar: Enlace = esAdmin ? { to: "/admin/suscripcion/activar", label: "Activar plan" } : null
  const vencida = suscripcion && (suscripcion.estado === "VENCIDA" || suscripcion.diasRestantes === 0)
  if (noDisponible || vencida) {
    return <Aviso tono="rojo" enlace={activar}><Warning weight="fill" /> Tu tienda está suspendida o vencida: tus clientas no pueden comprar.</Aviso>
  }
  if (bienvenida !== null) {
    return (
      <Aviso tono="verde" enlace={esAdmin ? { to: "/admin/catalogo", label: "Cargar mi primera prenda" } : null}>
        <Confetti weight="fill" /> Tu tienda está lista. Probala gratis {bienvenida} días. Empezá por darle tu estilo.
      </Aviso>
    )
  }
  if (suscripcion?.estado === "TRIAL" && suscripcion.diasRestantes <= 3) {
    return <Aviso tono="ambar" enlace={activar}><HourglassMedium weight="fill" /> Te quedan {suscripcion.diasRestantes} días de prueba.</Aviso>
  }
  return null
}
