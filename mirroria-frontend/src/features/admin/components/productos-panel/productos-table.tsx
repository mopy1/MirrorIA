import { PencilSimple, Plus } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Categoria, Producto } from "@/features/catalog/types/catalog.types"
import { formatMoney } from "@/lib/money"

interface ProductosTableProps {
  productos: Producto[]
  categorias: Categoria[]
  onOpenVariante: (id: string) => void
  onEditar: (producto: Producto) => void
}

export function ProductosTable({
  productos,
  categorias,
  onOpenVariante,
  onEditar,
}: ProductosTableProps) {
  const categoriaNombre = (id: string) =>
    categorias.find((c) => c.id === id)?.nombre ?? id

  return (
    <Card className="overflow-hidden p-0 border bg-card shadow-xs">
      <CardContent className="p-0">
        <Table className="min-w-[620px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[45%] font-medium text-xs">Prenda y Colección</TableHead>
              <TableHead className="w-[25%] font-medium text-xs">Categoría</TableHead>
              <TableHead className="w-[15%] font-medium text-xs">Precio</TableHead>
              <TableHead className="w-[15%] text-right font-medium text-xs">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                  No se encontraron prendas registradas.
                </TableCell>
              </TableRow>
            ) : (
              productos.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm text-foreground">{p.titulo}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{p.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {categoriaNombre(p.categoriaId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-foreground">
                    {formatMoney(p.precioCents)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => onEditar(p)}
                      >
                        <PencilSimple className="size-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => onOpenVariante(p.id)}
                      >
                        <Plus className="size-3 mr-1" />
                        Variante
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
