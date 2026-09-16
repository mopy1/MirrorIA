import { MagnifyingGlass } from "@phosphor-icons/react"
import { useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { cn } from "cn"

/** Búsqueda de producto por título — filtra en `useProductos` (ver AGENTS.md). */
export function SearchInput({ className }: { className?: string }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [valor, setValor] = useState(searchParams.get("q") ?? "")

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (valor.trim()) params.set("q", valor.trim())
    navigate(`/tienda${params.toString() ? `?${params}` : ""}`)
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className="h-9 rounded-full pl-8"
      />
    </form>
  )
}
