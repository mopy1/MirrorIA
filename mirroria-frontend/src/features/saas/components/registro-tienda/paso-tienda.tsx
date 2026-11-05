import { FieldGroup, FieldSeparator } from "@/components/ui/field"
import { useCiudades } from "../../hooks/useCiudades"
import type { EstadoSlug } from "../../hooks/useDisponibilidadSlug"
import type { Errores, FormRegistro } from "../../hooks/useRegistroTiendaForm"
import { CampoTexto } from "./campo-texto"
import { CiudadSelect } from "./ciudad-select"
import { SlugInput } from "./slug-input"

interface PasoTiendaProps {
  form: FormRegistro
  errores: Errores
  estadoSlug: EstadoSlug
  onTienda: (campo: "nombre" | "slug", v: string) => void
  onSucursal: (campo: keyof FormRegistro["sucursal"], v: string) => void
}

/** Paso 2: nombre + dirección de la tienda y su primera sucursal. */
export function PasoTienda({ form, errores, estadoSlug, onTienda, onSucursal }: PasoTiendaProps) {
  const { ciudades, isLoading } = useCiudades()
  return (
    <FieldGroup>
      <CampoTexto id="tienda-nombre" label="Nombre de la tienda" placeholder="Boutique Lila" value={form.tienda.nombre} onChange={(v) => onTienda("nombre", v)} error={errores["tienda.nombre"]} />
      <SlugInput value={form.tienda.slug} onChange={(v) => onTienda("slug", v)} estado={estadoSlug} error={errores["tienda.slug"]} />
      <FieldSeparator>Primera sucursal</FieldSeparator>
      <CampoTexto id="suc-nombre" label="Nombre de la sucursal" placeholder="Lila Equipetrol" value={form.sucursal.nombre} onChange={(v) => onSucursal("nombre", v)} error={errores["sucursal.nombre"]} />
      <CiudadSelect ciudades={ciudades} isLoading={isLoading} value={form.sucursal.ciudadId} onChange={(v) => onSucursal("ciudadId", v)} error={errores["sucursal.ciudadId"]} />
      <CampoTexto id="suc-direccion" label="Dirección" placeholder="Av. San Martín 1250" value={form.sucursal.direccion} onChange={(v) => onSucursal("direccion", v)} error={errores["sucursal.direccion"]} />
      <CampoTexto id="suc-telefono" label="Teléfono (opcional)" type="tel" placeholder="+591 70000000" value={form.sucursal.telefono} onChange={(v) => onSucursal("telefono", v)} maxLength={30} />
    </FieldGroup>
  )
}
