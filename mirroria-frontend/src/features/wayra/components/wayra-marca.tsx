import type { ButtonHTMLAttributes, ReactNode } from "react"

/** Tres ráfagas de viento: "wayra" es viento en quechua y aymara. */
export function WayraLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <path d="M4 11.5h15.5a3.5 3.5 0 1 0-3.4-4.3" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M4 17h22a3.5 3.5 0 1 1-3.4 4.3" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M4 22.5h9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}

interface WayraShellProps {
  children: ReactNode
  /** Barra fija abajo, como el botón principal de una app de banco. */
  accion?: ReactNode
}

/**
 * El marco de la app Wayra: su propia marca y colores, sin nada de MirrorIA,
 * porque representa la app del BANCO de quien paga. Siempre en claro: es otra
 * app, no hereda el tema de la tienda.
 */
export function WayraShell({ children, accion }: WayraShellProps) {
  return (
    <div className="min-h-dvh bg-[#F6F8FC] text-[#16306B] [color-scheme:light]">
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col">
        <header className="flex items-center gap-2.5 bg-[#2453C9] px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] text-white">
          <WayraLogo className="size-7" />
          <span className="text-lg font-semibold tracking-tight">Wayra</span>
          <span className="ml-auto text-sm text-white/75">Banca móvil</span>
        </header>

        <main className="flex flex-1 flex-col px-5 py-6">{children}</main>

        {accion && (
          <div className="sticky bottom-0 bg-[#F6F8FC]/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            {accion}
          </div>
        )}

        <p className="px-5 pb-5 text-center text-[11px] leading-relaxed text-[#16306B]/45">
          Wayra es un banco ficticio del entorno de pruebas de MirrorIA. No se mueve dinero real.
        </p>
      </div>
    </div>
  )
}

/** El botón principal de Wayra, con su color de marca. */
export function WayraBoton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="h-13 w-full rounded-xl bg-[#2453C9] text-base font-semibold text-white transition-colors hover:bg-[#1D45AA] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#2453C9]/50 disabled:bg-[#2453C9]/40"
    >
      {children}
    </button>
  )
}
