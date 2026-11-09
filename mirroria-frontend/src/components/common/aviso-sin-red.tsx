import type { ReactNode } from "react"
import { WifiSlash } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"

/** Banda ámbar para pantallas que funcionan sin red pero con límites (RN08/RN09). */
export function AvisoSinRed({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Alert className={className ?? "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300"}>
      <WifiSlash />
      <AlertDescription className="text-amber-800 dark:text-amber-300">{children}</AlertDescription>
    </Alert>
  )
}
