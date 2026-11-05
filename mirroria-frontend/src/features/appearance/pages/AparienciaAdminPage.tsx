import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AparienciaCabecera } from "../components/apariencia-cabecera"
import { EditorApariencia } from "../components/editor-apariencia"
import { useMiMarca } from "../hooks/useMiMarca"

/** `/admin/apariencia` (solo ADMIN): personalizar la tienda con vista previa en vivo (CU34-CU36). */
export function AparienciaAdminPage() {
  const { data, setData, isLoading, error, reload } = useMiMarca()
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
      {isLoading && (
        <>
          <AparienciaCabecera mi={null} />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <Skeleton className="h-[520px] rounded-xl" />
            <Skeleton className="hidden aspect-[16/10] rounded-xl lg:block" />
          </div>
        </>
      )}
      {error && !isLoading && (
        <>
          <AparienciaCabecera mi={null} />
          <Alert variant="destructive">
            <WarningCircle weight="fill" />
            <AlertDescription>{error}</AlertDescription>
            <AlertAction><Button size="sm" variant="outline" onClick={reload} className="gap-1.5"><ArrowClockwise /> Reintentar</Button></AlertAction>
          </Alert>
        </>
      )}
      {data && !isLoading && <EditorApariencia mi={data} onActualizado={setData} />}
    </div>
  )
}
