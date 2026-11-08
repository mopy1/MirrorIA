import { useMemo, useState } from "react"
import { CloudSlash, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/money"
import { CarritoMostrador } from "../components/carrito-mostrador"
import { useMostrador } from "../hooks/useMostrador"
import { agregarLinea, quitarLinea, type ItemMostrador, type LineaVenta } from "../lib/venta-mostrador"

/** `/admin/mostrador`: venta en caja. Sigue funcionando sin internet. */
export function MostradorPage() {
  const m = useMostrador()
  const [busqueda, setBusqueda] = useState("")
  const [lineas, setLineas] = useState<LineaVenta[]>([])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return m.catalogo.filter((i: ItemMostrador) => !q || `${i.titulo} ${i.talla} ${i.color} ${i.sku}`.toLowerCase().includes(q)).slice(0, 60)
  }, [m.catalogo, busqueda])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mostrador</h1>
        <p className="mt-1 text-sm text-muted-foreground">Registrá ventas en caja, con o sin internet.</p>
      </div>

      {!m.online && (
        <Alert>
          <CloudSlash />
          <AlertDescription>
            Sin conexión. Las ventas se guardan en este equipo y se envían solas al volver internet.
            {m.obsoleto && " El catálogo guardado tiene más de 7 días: el stock puede no ser real."}
          </AlertDescription>
        </Alert>
      )}
      {m.error && (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{m.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, talla, color o SKU" className="pl-9" aria-label="Buscar prenda" />
            </div>
            {m.debeElegirSucursal && (
              <select
                aria-label="Sucursal"
                value={m.sucursalId ?? ""}
                onChange={(e) => { m.setElegida(e.target.value); setLineas([]) }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {m.sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            )}
          </div>
          {m.cargando && m.catalogo.length === 0 && <Skeleton className="h-64 rounded-xl" />}
          {!m.cargando && visibles.length === 0 && !m.error && (
            <p className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">No hay prendas para mostrar.</p>
          )}
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map((item) => {
              const disponible = m.disponible(item)
              return (
                <li key={item.varianteId}>
                  <button
                    type="button"
                    disabled={disponible === 0}
                    onClick={() => setLineas((l) => agregarLinea(l, item, disponible))}
                    className="w-full rounded-xl border border-border/60 bg-card p-3 text-left text-sm transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="block font-medium">{item.titulo}</span>
                    <span className="block text-xs text-muted-foreground">{item.talla} · {item.color}</span>
                    <span className="mt-2 flex items-center justify-between">
                      <span className="tabular-nums">{formatMoney(item.precioCents)}</span>
                      <span className="text-xs text-muted-foreground">{disponible === 0 ? "Agotado" : `${disponible} disp.`}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
        <CarritoMostrador
          lineas={lineas}
          pendientes={m.pendientes.length}
          onQuitar={(id) => setLineas((l) => quitarLinea(l, id))}
          onVendido={() => setLineas([])}
          vender={m.vender}
        />
      </div>
    </div>
  )
}
