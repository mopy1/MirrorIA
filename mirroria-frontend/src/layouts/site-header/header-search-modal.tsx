import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react"
import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useRutaTienda } from "@/hooks/useRutaTienda"

const SUGERENCIAS = ["Vestidos", "Blusas", "Lino", "Pantalones", "Fiesta"]

/** Modal emergente de búsqueda con sugerencias rápidas de catálogo. */
export function HeaderSearchModal() {
  const [abierto, setAbierto] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const ruta = useRutaTienda()

  function buscar(termino: string) {
    const q = termino.trim()
    setAbierto(false)
    setQuery("")
    if (q) {
      navigate(ruta(`/tienda?q=${encodeURIComponent(q)}`))
    } else {
      navigate(ruta("/tienda"))
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    buscar(query)
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Buscar productos"
            className="size-8.5 rounded-full text-foreground/80 hover:bg-muted/50 hover:text-foreground"
          >
            <MagnifyingGlass className="size-4.5" />
          </Button>
        }
      />
      <DialogContent className="max-w-md p-5 sm:rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Buscar en la boutique</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex items-center">
            <MagnifyingGlass className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando hoy?"
              className="h-11 rounded-lg pl-9 pr-10 text-sm focus-visible:ring-primary"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-1 size-8 text-muted-foreground hover:text-primary"
              aria-label="Ejecutar búsqueda"
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide">Tendencias de búsqueda</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGERENCIAS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => buscar(tag)}
                  className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
