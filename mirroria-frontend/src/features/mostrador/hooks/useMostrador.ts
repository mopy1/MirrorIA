import { useCallback, useEffect, useMemo, useState } from "react"
import { branchesApi } from "@/features/branches/api/branchesApi"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { guardarEnCatalogoCache, obtenerDeCatalogoCache } from "@/lib/offline/idb"
import { EVENTO_CONFLICTO_STOCK, outboxManager } from "@/lib/offline/outbox-manager"
import { useOutbox } from "@/lib/offline/use-outbox"
import { mostradorApi, type VentaRegistrada } from "../api/mostradorApi"
import { disponibleLocal, registrarVenta, type ItemMostrador, type LineaVenta, type ResultadoVenta } from "../lib/venta-mostrador"

interface Sucursal { id: string; nombre: string }
const TIPO_VENTA = "VENTA_PRESENCIAL"

async function conCache<T>(id: string, tienda: string, traer: () => Promise<T>): Promise<{ datos: T | null; obsoleto: boolean; delCache: boolean }> {
  try {
    const datos = await traer()
    await guardarEnCatalogoCache({ id, tenantId: tienda, datos })
    return { datos, obsoleto: false, delCache: false }
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) throw error
    const guardado = await obtenerDeCatalogoCache<T>(id)
    return { datos: guardado?.datos ?? null, obsoleto: guardado?.obsoleto ?? false, delCache: true }
  }
}

/** Mostrador: catálogo guardado por sucursal y ventas que siguen sin conexión. */
export function useMostrador() {
  const { user } = useAuth()
  const tienda = user?.tenant?.slug ?? ""
  const propia = user?.sucursalId ?? null
  const { online, operaciones } = useOutbox(tienda)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [elegida, setElegida] = useState<string | null>(null)
  const sucursalId = propia ?? elegida
  const [catalogo, setCatalogo] = useState<ItemMostrador[]>([])
  const [estado, setEstado] = useState({ cargando: true, obsoleto: false, delCache: false, error: null as string | null })

  useEffect(() => {
    if (!tienda || propia) return
    conCache(`sucursales:${tienda}`, tienda, () => branchesApi.getSucursales() as Promise<Sucursal[]>)
      .then(({ datos }) => {
        setSucursales(datos ?? [])
        setElegida((actual) => actual ?? datos?.[0]?.id ?? null)
      })
      .catch(() => setSucursales([]))
  }, [tienda, propia])

  const cargar = useCallback(async () => {
    if (!sucursalId || !tienda) return
    setEstado((e) => ({ ...e, cargando: true, error: null }))
    try {
      const r = await conCache(`mostrador:${tienda}:${sucursalId}`, tienda, () => mostradorApi.getCatalogo(sucursalId))
      setCatalogo(r.datos ?? [])
      setEstado({
        cargando: false, obsoleto: r.obsoleto, delCache: r.delCache,
        error: r.datos ? null : "Sin conexión y sin catálogo guardado. Abrí esta pantalla una vez con internet.",
      })
    } catch (e) {
      setEstado({ cargando: false, obsoleto: false, delCache: false, error: e instanceof Error ? e.message : "No se pudo cargar el catálogo" })
    }
  }, [sucursalId, tienda])

  useEffect(() => { void cargar() }, [cargar, online])

  const pendientes = useMemo(
    () => operaciones.filter((o) => o.tipo === TIPO_VENTA && (o.estado === "PENDIENTE" || o.estado === "SINCRONIZANDO")),
    [operaciones],
  )
  const disponible = useCallback((item: ItemMostrador) => disponibleLocal(item, pendientes), [pendientes])

  async function vender(lineas: LineaVenta[]): Promise<ResultadoVenta<VentaRegistrada>> {
    // El mismo cuerpo con red y en la cola: si la respuesta se perdió, el reintento
    // usa la misma clave y tiene que coincidir byte a byte o el servidor lo rechaza.
    const payload = {
      sucursalId: sucursalId ?? "",
      vendidaEn: new Date().toISOString(),
      items: lineas.map((l) => ({ varianteId: l.item.varianteId, cantidad: l.cantidad, precioUnitCents: l.item.precioCents })),
    }
    try {
      const r = await registrarVenta(payload, {
        enLinea: () => outboxManager.isOnline(),
        enviar: mostradorApi.registrarVenta,
        encolar: (p, clave) =>
          outboxManager.encolarOperacion({
            tenantId: tienda, tipo: TIPO_VENTA, endpoint: "/ventas/presenciales", idempotencyKey: clave,
            payload: { ...p },
          }),
        generarClave: () => crypto.randomUUID(),
      })
      if (r.estado === "REGISTRADA") void cargar()
      return r
    } catch (e) {
      if (e instanceof ApiError && e.codigo === "STOCK_AGOTADO_CONFLICTO") {
        window.dispatchEvent(new CustomEvent(EVENTO_CONFLICTO_STOCK, { detail: e.detalles ?? {} }))
        void cargar()
      }
      throw e
    }
  }

  return { online, sucursales, sucursalId, debeElegirSucursal: !propia, setElegida, catalogo, ...estado, disponible, pendientes, vender }
}
