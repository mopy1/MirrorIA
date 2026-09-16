import type { ReactNode } from "react"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"

export function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div id="top" className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
