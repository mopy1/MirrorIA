import {
  Calendar,
  Package,
  Palette,
  Ruler,
  Sparkle,
  Tag,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoriasPanel } from "../components/categorias-panel"
import { ColeccionesPanel } from "../components/colecciones-panel"
import { ColoresPanel } from "../components/colores-panel"
import { ProductosPanel } from "../components/productos-panel"
import { TallasPanel } from "../components/tallas-panel"
import { TemporadasPanel } from "../components/temporadas-panel"

export function CatalogoAdminPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de productos, variantes, temporadas, colecciones y atributos de prendas.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-normal w-fit">
          <Package className="size-3.5 text-muted-foreground" />
          <span>6 módulos</span>
        </Badge>
      </div>

      <Tabs defaultValue="productos" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="productos" className="gap-1.5 text-xs py-1.5 px-3">
            <Package className="size-3.5" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-1.5 text-xs py-1.5 px-3">
            <Tag className="size-3.5" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="colecciones" className="gap-1.5 text-xs py-1.5 px-3">
            <Sparkle className="size-3.5" />
            Colecciones
          </TabsTrigger>
          <TabsTrigger value="temporadas" className="gap-1.5 text-xs py-1.5 px-3">
            <Calendar className="size-3.5" />
            Temporadas
          </TabsTrigger>
          <TabsTrigger value="tallas" className="gap-1.5 text-xs py-1.5 px-3">
            <Ruler className="size-3.5" />
            Tallas
          </TabsTrigger>
          <TabsTrigger value="colores" className="gap-1.5 text-xs py-1.5 px-3">
            <Palette className="size-3.5" />
            Colores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="productos">
          <ProductosPanel />
        </TabsContent>
        <TabsContent value="categorias">
          <CategoriasPanel />
        </TabsContent>
        <TabsContent value="colecciones">
          <ColeccionesPanel />
        </TabsContent>
        <TabsContent value="temporadas">
          <TemporadasPanel />
        </TabsContent>
        <TabsContent value="tallas">
          <TallasPanel />
        </TabsContent>
        <TabsContent value="colores">
          <ColoresPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
