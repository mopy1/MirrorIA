import { MapPin, Storefront } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CiudadesPanel } from "../components/ciudades-panel"
import { SucursalesPanel } from "../components/sucursales-panel"

export function SucursalesAdminPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sucursales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ciudades habilitadas y tiendas físicas con cobertura de inventario.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-normal w-fit">
          <Storefront className="size-3.5 text-muted-foreground" />
          <span>Sedes físicas</span>
        </Badge>
      </div>

      <Tabs defaultValue="sucursales" className="space-y-6">
        <TabsList className="p-1 gap-1">
          <TabsTrigger value="sucursales" className="gap-1.5 text-xs py-1.5 px-3">
            <Storefront className="size-3.5" />
            Sucursales
          </TabsTrigger>
          <TabsTrigger value="ciudades" className="gap-1.5 text-xs py-1.5 px-3">
            <MapPin className="size-3.5" />
            Ciudades
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sucursales">
          <SucursalesPanel />
        </TabsContent>
        <TabsContent value="ciudades">
          <CiudadesPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
