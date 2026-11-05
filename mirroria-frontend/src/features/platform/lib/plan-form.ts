import type { NivelMarca } from "@/types/marca.types"
import type { CrearPlanDto, PlanDto } from "../types/plataforma.types"

/** Valores del formulario de plan como texto (inputs controlados). Límite vacío = ilimitado. */
export interface PlanForm {
  codigo: string
  nombre: string
  descripcion: string
  precioBs: string
  precioUsd: string
  diasPrueba: string
  orden: string
  maxSucursales: string
  maxProductos: string
  maxUsuariosStaff: string
  activo: boolean
  nivelMarca: NivelMarca
  destacado: boolean
}

const txt = (n: number | null) => (n === null ? "" : String(n))
const dinero = (cents: number) => (cents / 100).toFixed(2)

export function formDesdePlan(p: PlanDto | null): PlanForm {
  if (!p) {
    return { codigo: "", nombre: "", descripcion: "", precioBs: "", precioUsd: "", diasPrueba: "14", orden: "0", maxSucursales: "", maxProductos: "", maxUsuariosStaff: "", activo: true, nivelMarca: "ESENCIAL", destacado: false }
  }
  return {
    codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion ?? "",
    precioBs: dinero(p.precioMensualCents), precioUsd: dinero(p.precioMensualUsdCents),
    diasPrueba: String(p.diasPrueba), orden: String(p.orden),
    maxSucursales: txt(p.limites.maxSucursales), maxProductos: txt(p.limites.maxProductos), maxUsuariosStaff: txt(p.limites.maxUsuariosStaff),
    activo: p.activo,
    nivelMarca: p.nivelMarca ?? "ESENCIAL",
    destacado: p.destacado ?? false,
  }
}

const limite = (v: string) => (v.trim() === "" ? null : Math.max(1, Math.round(Number(v))))

/** Error de validación local (mismas reglas que el backend) o null. */
export function errorPlanForm(f: PlanForm, creando: boolean): string | null {
  if (creando && !/^[a-z0-9-]{3,30}$/.test(f.codigo)) return "Código: 3-30 caracteres en minúscula, números o guiones"
  if (f.nombre.trim().length < 2) return "Ingresá el nombre del plan"
  if (!(Number(f.precioBs) >= 0) || !(Number(f.precioUsd) >= 0) || f.precioBs === "" || f.precioUsd === "") return "Los precios deben ser números ≥ 0"
  const dias = Number(f.diasPrueba)
  if (!Number.isInteger(dias) || dias < 0 || dias > 60) return "Días de prueba: entre 0 y 60"
  return null
}

export function dtoDesdeForm(f: PlanForm): CrearPlanDto {
  return {
    codigo: f.codigo.trim(),
    nombre: f.nombre.trim(),
    descripcion: f.descripcion.trim() || undefined,
    precioMensualCents: Math.round(Number(f.precioBs) * 100),
    precioMensualUsdCents: Math.round(Number(f.precioUsd) * 100),
    diasPrueba: Number(f.diasPrueba),
    orden: Number(f.orden) || 0,
    limites: { maxSucursales: limite(f.maxSucursales), maxProductos: limite(f.maxProductos), maxUsuariosStaff: limite(f.maxUsuariosStaff) },
    nivelMarca: f.nivelMarca,
    destacado: f.destacado,
  }
}
