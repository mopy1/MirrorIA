import { useMemo } from "react"
import type { Carrito } from "@/features/cart/types/cart.types"
import type { OperacionOutbox } from "@/lib/offline/idb.types"
import { useOutbox } from "@/lib/offline/use-outbox"

const enCurso = (o: OperacionOutbox) => o.estado === "PENDIENTE" || o.estado === "ENVIANDO"

/** Suma al carrito del servidor lo agregado sin red que todavía no se confirmó (puro, con test). */
export function mezclarCarrito(carrito: Carrito | null, ops: OperacionOutbox[], usuarioId: string): Carrito | null {
  const agregados = ops.filter((o) => o.tipo === "CARRITO_AGREGAR" && enCurso(o))
  if (agregados.length === 0) return carrito
  const items = [...(carrito?.items ?? [])].map((i) => ({ ...i }))
  for (const op of agregados) {
    const { varianteId, cantidad } = op.payload as { varianteId: string; cantidad: number }
    const existente = items.find((i) => i.varianteId === varianteId)
    if (existente) existente.cantidad += cantidad
    else items.push({ varianteId, cantidad })
  }
  return { id: carrito?.id ?? "local", usuarioId: carrito?.usuarioId ?? usuarioId, items }
}

/** Lo que la outbox le agrega al carrito: ítems "Pendiente de confirmar" y si hay una compra en cola. */
export function useCarritoEnCola(slug: string | null, usuarioId: string | null) {
  const { operaciones, online } = useOutbox({ tenantId: slug ?? undefined, usuarioId: usuarioId ?? undefined })
  return useMemo(() => {
    const propias = operaciones.filter(enCurso)
    return {
      online,
      operaciones,
      variantesPendientes: propias.filter((o) => o.tipo === "CARRITO_AGREGAR").map((o) => String(o.payload.varianteId)),
      checkoutEnCola: propias.some((o) => o.tipo === "CHECKOUT"),
      /** Cambia cuando una operación sale de la cola: momento de releer el carrito del servidor. */
      firmaCola: propias.map((o) => o.id).join(","),
    }
  }, [operaciones, online])
}
