import { useState } from "react"
import { CheckCircle, CircleNotch, CloudArrowUp, Trash, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/money"
import type { VentaRegistrada } from "../api/mostradorApi"
import { totalCents, type LineaVenta, type ResultadoVenta } from "../lib/venta-mostrador"

interface CarritoMostradorProps {
  lineas: LineaVenta[]
  pendientes: number
  onQuitar: (varianteId: string) => void
  onVendido: () => void
  vender: (lineas: LineaVenta[]) => Promise<ResultadoVenta<VentaRegistrada>>
}

export function CarritoMostrador({ lineas, pendientes, onQuitar, onVendido, vender }: CarritoMostradorProps) {
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: "ok" | "cola" | "error"; texto: string } | null>(null)

  async function cobrar() {
    setGuardando(true)
    setAviso(null)
    try {
      const r = await vender(lineas)
      setAviso(
        r.estado === "REGISTRADA"
          ? { tipo: "ok", texto: `Venta registrada${r.venta.numeroComprobante ? ` · ${r.venta.numeroComprobante}` : ""}.` }
          : { tipo: "cola", texto: "Venta guardada en este equipo. Se envía sola al volver internet." },
      )
      onVendido()
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo registrar la venta" })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <aside className="h-fit space-y-4 rounded-xl border border-border/60 bg-card p-4 lg:sticky lg:top-4">
      <h2 className="font-medium">Venta actual</h2>
      {lineas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tocá una prenda para agregarla.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {lineas.map((l) => (
            <li key={l.item.varianteId} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate">{l.cantidad} × {l.item.titulo}</span>
                <span className="block text-xs text-muted-foreground">{l.item.talla} · {l.item.color}</span>
              </span>
              <span className="tabular-nums">{formatMoney(l.item.precioCents * l.cantidad)}</span>
              <Button size="icon-sm" variant="ghost" aria-label={`Quitar ${l.item.titulo}`} onClick={() => onQuitar(l.item.varianteId)}><Trash /></Button>
            </li>
          ))}
        </ul>
      )}
      <p className="flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-2xl font-semibold tabular-nums">{formatMoney(totalCents(lineas))}</span>
      </p>
      <Button className="w-full gap-2" size="lg" disabled={guardando || lineas.length === 0} onClick={cobrar}>
        {guardando && <CircleNotch className="size-4 animate-spin" />}
        {guardando ? "Registrando..." : "Cobrar en efectivo"}
      </Button>
      {aviso && (
        <Alert variant={aviso.tipo === "error" ? "destructive" : "default"}>
          {aviso.tipo === "ok" && <CheckCircle weight="fill" />}
          {aviso.tipo === "cola" && <CloudArrowUp />}
          {aviso.tipo === "error" && <WarningCircle weight="fill" />}
          <AlertDescription>{aviso.texto}</AlertDescription>
        </Alert>
      )}
      {pendientes > 0 && (
        <p className="text-xs text-muted-foreground">{pendientes} {pendientes === 1 ? "venta espera" : "ventas esperan"} sincronizarse.</p>
      )}
    </aside>
  )
}
