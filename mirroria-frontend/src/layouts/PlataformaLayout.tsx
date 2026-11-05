import { Suspense, useState } from "react"
import { PageFallback } from "@/components/common/PageFallback"
import { List } from "@phosphor-icons/react"
import { Outlet } from "react-router-dom"
import { PlataformaLogo } from "@/components/marca/plataforma-logo"
import { useTemaPlataforma } from "@/hooks/useTemaPlataforma"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { PlataformaSidebar } from "./plataforma-sidebar"

/** Layout de `/plataforma/*`: sidebar fijo en desktop, Sheet en móvil. */
export function PlataformaLayout() {
  useTemaPlataforma()
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2.5 border-b border-border bg-card/95 px-4 backdrop-blur-sm lg:hidden">
        <Button variant="ghost" size="sm" className="size-9 p-0" onClick={() => setAbierto(true)} aria-label="Abrir menú de navegación">
          <List className="size-5" />
        </Button>
        <PlataformaLogo size="sm" />
      </header>
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent side="left" showCloseButton={false} className="flex h-full w-72 flex-col p-0">
          <PlataformaSidebar onNavigate={() => setAbierto(false)} />
        </SheetContent>
      </Sheet>
      <aside className="hidden shrink-0 border-r border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:flex-col">
        <PlataformaSidebar />
      </aside>
      <main className="min-w-0 flex-1 bg-muted/15">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
