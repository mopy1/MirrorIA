import { formatearMontoBs } from "../../lib/dashboard.utils"
import type { TopPrendaDto, TopProveedorDto } from "../../types/dashboard.types"
import { ListaBarras, ListaBarrasSkeleton } from "../shared/lista-barras"
import { Seccion, VacioUtil } from "../shared/seccion"

const unidades = (n: number) => `${n} ${n === 1 ? "unidad vendida" : "unidades vendidas"}`

export function PrendasMasVendidas({ prendas, isLoading }: { prendas?: TopPrendaDto[]; isLoading?: boolean }) {
  const titulo = "Prendas más vendidas"
  const enlace = { href: "/admin/catalogo", texto: "Ver catálogo" }
  if (isLoading || !prendas) {
    return (
      <Seccion titulo={titulo}>
        <ListaBarrasSkeleton conImagen />
      </Seccion>
    )
  }
  if (prendas.length === 0) {
    return (
      <Seccion titulo={titulo}>
        <VacioUtil texto="Todavía no vendiste prendas en estas fechas. Cuando vendas, aquí vas a ver cuáles salen más para reponerlas a tiempo." enlace={enlace} />
      </Seccion>
    )
  }
  const max = Math.max(...prendas.map((p) => p.unidadesVendidas), 1)
  return (
    <Seccion titulo={titulo} descripcion="Ordenadas por unidades vendidas" enlace={enlace}>
      <ListaBarras
        conImagen
        filas={prendas.map((p) => ({
          id: p.productoId,
          nombre: p.nombre,
          detalle: p.categoria ? `${unidades(p.unidadesVendidas)} · ${p.categoria}` : unidades(p.unidadesVendidas),
          valor: formatearMontoBs(p.ingresosBs),
          proporcion: p.unidadesVendidas / max,
          imagenUrl: p.imagenUrl,
        }))}
      />
    </Seccion>
  )
}

export function ProveedoresTop({ proveedores, isLoading }: { proveedores?: TopProveedorDto[]; isLoading?: boolean }) {
  const titulo = "Proveedores que más venden"
  const enlace = { href: "/admin/proveedores", texto: "Ver proveedores" }
  if (isLoading || !proveedores) {
    return (
      <Seccion titulo={titulo}>
        <ListaBarrasSkeleton />
      </Seccion>
    )
  }
  if (proveedores.length === 0) {
    return (
      <Seccion titulo={titulo}>
        <VacioUtil texto="Las prendas vendidas todavía no tienen proveedor asignado. Asignalo en cada prenda para saber de quién conviene comprar más." enlace={enlace} />
      </Seccion>
    )
  }
  const max = Math.max(...proveedores.map((p) => p.ingresosBs), 1)
  return (
    <Seccion
      titulo={titulo}
      ayuda="Suma lo vendido de las prendas de cada proveedor en estas fechas. Sirve para decidir a quién volver a comprar."
      descripcion="Ordenados por lo vendido"
      enlace={enlace}
    >
      <ListaBarras
        filas={proveedores.map((p) => ({
          id: p.proveedorId,
          nombre: p.nombre,
          detalle: `${p.unidadesVendidas} ${p.unidadesVendidas === 1 ? "prenda vendida" : "prendas vendidas"}`,
          valor: formatearMontoBs(p.ingresosBs),
          proporcion: p.ingresosBs / max,
        }))}
      />
    </Seccion>
  )
}
