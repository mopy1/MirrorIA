import { useMemo, useState } from "react"
import { MagnifyingGlass, Plus, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResourceCreateDialog } from "./resource-create-dialog"
import { ResourceTable, type ColumnConfig } from "./resource-table"

export type { ColumnConfig }

export interface FieldConfig {
  name: string
  label: string
  type?: "text" | "number" | "textarea" | "select" | "date"
  required?: boolean
  options?: { value: string; label: string }[]
}

interface SimpleResourceManagerProps<T> {
  title: string
  createButtonLabel?: string
  columns: ColumnConfig<T>[]
  fields: FieldConfig[]
  items: T[]
  isLoading: boolean
  error: string | null
  onCreate: (values: Record<string, string>) => Promise<boolean>
  isCreating: boolean
  createError: string | null
  searchKey?: string
}

export function SimpleResourceManager<T>({
  title,
  createButtonLabel,
  columns,
  fields,
  items,
  isLoading,
  error,
  onCreate,
  isCreating,
  createError,
  searchKey,
}: SimpleResourceManagerProps<T>) {
  const [openModal, setOpenModal] = useState(false)
  const [search, setSearch] = useState("")
  const [values, setValues] = useState<Record<string, string>>({})

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ok = await onCreate(values)
    if (ok) {
      setValues({})
      setOpenModal(false)
    }
  }

  const itemsFiltrados = useMemo(() => {
    if (!search.trim()) return items
    const term = search.toLowerCase()
    return items.filter((item) => {
      if (searchKey) {
        const val = String((item as Record<string, unknown>)[searchKey] ?? "")
        return val.toLowerCase().includes(term)
      }
      return Object.values(item as Record<string, unknown>).some((v) =>
        String(v ?? "").toLowerCase().includes(term)
      )
    })
  }, [items, search, searchKey])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar en ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {items.length} {items.length === 1 ? "registro" : "registros"}
          </Badge>
          <Button onClick={() => setOpenModal(true)} className="gap-1.5 h-10 text-xs">
            <Plus className="size-3.5" />
            <span>{createButtonLabel ?? `Nuevo ${title.slice(0, -1) || title}`}</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ResourceTable
        columns={columns}
        items={itemsFiltrados}
        isLoading={isLoading}
        search={search}
      />

      <ResourceCreateDialog
        open={openModal}
        onOpenChange={setOpenModal}
        title={title}
        fields={fields}
        values={values}
        onValueChange={(name, val) => setValues((v) => ({ ...v, [name]: val }))}
        onSubmit={handleSubmit}
        isCreating={isCreating}
        createError={createError}
      />
    </div>
  )
}
