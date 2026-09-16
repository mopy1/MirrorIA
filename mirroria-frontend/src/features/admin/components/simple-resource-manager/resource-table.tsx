import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface ColumnConfig<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
}

interface ResourceTableProps<T> {
  columns: ColumnConfig<T>[]
  items: T[]
  isLoading: boolean
  search: string
}

export function ResourceTable<T>({
  columns,
  items,
  isLoading,
  search,
}: ResourceTableProps<T>) {
  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" />
  }

  return (
    <Card className="overflow-hidden p-0 border bg-card shadow-xs">
      <CardContent className="p-0">
        <Table className="min-w-[480px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className="font-medium text-xs">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {search ? "No se encontraron coincidencias para la búsqueda." : "No hay registros disponibles."}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, i) => (
                <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                  {columns.map((col) => (
                    <TableCell key={col.key} className="text-sm">
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
