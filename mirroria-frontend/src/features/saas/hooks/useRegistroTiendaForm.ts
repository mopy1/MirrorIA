import { useState } from "react"
import { errorDeSlug, slugDesdeNombre } from "../lib/slug"
import type { CodigoPaleta } from "@/types/marca.types"
import type { RegistrarTiendaDto } from "../types/saas.types"

export type FormRegistro = RegistrarTiendaDto & { tienda: { paleta: CodigoPaleta }; sucursal: { telefono: string } }
export type Errores = Partial<Record<string, string>>
export const PASOS = ["Plan", "Tu tienda y sucursal", "Tu cuenta"] as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validar(paso: number, f: FormRegistro): Errores {
  const e: Errores = {}
  if (paso === 0 && !f.planCodigo) e.planCodigo = "Elegí un plan"
  if (paso === 1) {
    if (f.tienda.nombre.trim().length < 3) e["tienda.nombre"] = "Mínimo 3 caracteres"
    const slug = errorDeSlug(f.tienda.slug)
    if (slug) e["tienda.slug"] = slug
    if (f.sucursal.nombre.trim().length < 3) e["sucursal.nombre"] = "Mínimo 3 caracteres"
    if (f.sucursal.direccion.trim().length < 5) e["sucursal.direccion"] = "Mínimo 5 caracteres"
    if (!f.sucursal.ciudadId) e["sucursal.ciudadId"] = "Elegí la ciudad"
  }
  if (paso === 2) {
    if (f.admin.fullName.trim().length < 2) e["admin.fullName"] = "Ingresá tu nombre completo"
    if (!EMAIL.test(f.admin.email.trim())) e["admin.email"] = "Email inválido"
    if (f.admin.password.length < 8) e["admin.password"] = "Mínimo 8 caracteres"
  }
  return e
}

/** Estado del asistente de 3 pasos (validación local igual a la del backend, spec §6.2). */
export function useRegistroTiendaForm(planInicial: string, paletaInicial: CodigoPaleta = "grafito") {
  const [paso, setPaso] = useState(0)
  const [errores, setErrores] = useState<Errores>({})
  const [slugTocado, setSlugTocado] = useState(false)
  const [form, setForm] = useState<FormRegistro>({
    planCodigo: planInicial,
    tienda: { nombre: "", slug: "", paleta: paletaInicial },
    sucursal: { nombre: "", direccion: "", ciudadId: "", telefono: "" },
    admin: { fullName: "", email: "", password: "" },
  })

  function set<K extends "tienda" | "sucursal" | "admin">(grupo: K, campo: keyof FormRegistro[K], valor: string) {
    setForm((f) => {
      const next = { ...f, [grupo]: { ...f[grupo], [campo]: valor } }
      // El slug se sugiere desde el nombre hasta que la persona lo edita a mano.
      if (grupo === "tienda" && campo === "nombre" && !slugTocado) next.tienda.slug = slugDesdeNombre(valor)
      return next
    })
    if (grupo === "tienda" && campo === "slug") setSlugTocado(true)
  }

  function avanzar(): boolean {
    const e = validar(paso, form)
    setErrores(e)
    if (Object.keys(e).length > 0) return false
    setPaso((p) => Math.min(p + 1, PASOS.length - 1))
    return true
  }

  function dto(): RegistrarTiendaDto {
    const { telefono, ...sucursal } = form.sucursal
    return {
      planCodigo: form.planCodigo,
      tienda: { nombre: form.tienda.nombre.trim(), slug: form.tienda.slug, paleta: form.tienda.paleta },
      sucursal: { ...sucursal, ...(telefono.trim() ? { telefono: telefono.trim() } : {}) },
      admin: { ...form.admin, email: form.admin.email.trim().toLowerCase() },
    }
  }

  return {
    paso, form, errores, set, avanzar, dto,
    setPlan: (codigo: string) => setForm((f) => ({ ...f, planCodigo: codigo })),
    setPaleta: (paleta: CodigoPaleta) => setForm((f) => ({ ...f, tienda: { ...f.tienda, paleta } })),
    volver: () => setPaso((p) => Math.max(p - 1, 0)),
    esValido: () => Object.keys(validar(paso, form)).length === 0,
  }
}
