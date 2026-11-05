import { useState, type FormEvent } from "react"
import { ArrowRight, Storefront } from "@phosphor-icons/react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SLUG_DEMO } from "@/lib/rutas-tienda"
import { errorDeSlug, slugDesdeNombre } from "../lib/slug"

/** `/entrar` — "¿cuál es la dirección de tu tienda?" → `/t/:slug/login`. */
export function EntrarPage() {
  const navigate = useNavigate()
  const [valor, setValor] = useState("")
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const slug = slugDesdeNombre(valor.replace(/^.*\/t\//, ""))
    const problema = errorDeSlug(slug)
    if (problema) return setError(problema)
    navigate(`/t/${slug}/login`)
  }

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-20 sm:px-6">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Storefront className="size-6" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Entrá a tu tienda</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Cada tienda tiene sus propias cuentas. Escribí la dirección de la tienda donde tenés tu cuenta (clienta o staff).
      </p>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="slug">Dirección de la tienda</FieldLabel>
          <div className="flex items-center rounded-lg border border-input bg-background pl-3 text-sm focus-within:ring-3 focus-within:ring-ring/50">
            <span className="text-muted-foreground">/t/</span>
            <Input id="slug" value={valor} onChange={(e) => { setValor(e.target.value); setError(null) }} placeholder="boutique-lila" className="border-0 pl-1 focus-visible:ring-0" aria-invalid={!!error} />
          </div>
          {error ? <FieldError>{error}</FieldError> : <FieldDescription>Está en el link que te compartió la tienda.</FieldDescription>}
        </Field>
        <Button type="submit" size="lg" className="gap-2">
          Continuar <ArrowRight weight="bold" />
        </Button>
      </form>
      <div className="mt-8 flex flex-col gap-2 text-sm text-muted-foreground">
        <p>
          ¿Querés ver cómo funciona?{" "}
          <Link to={`/t/${SLUG_DEMO}`} className="font-medium text-primary hover:underline">Abrí la tienda demo</Link>
        </p>
        <p>
          ¿Todavía no tenés tienda?{" "}
          <Link to="/registro-tienda" className="font-medium text-primary hover:underline">Creala en 5 minutos</Link>
        </p>
      </div>
    </section>
  )
}
