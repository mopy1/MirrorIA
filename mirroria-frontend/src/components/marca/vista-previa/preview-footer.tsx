import { EnvelopeSimple, FacebookLogo, InstagramLogo, TiktokLogo, WhatsappLogo } from "@phosphor-icons/react"
import { cn } from "cn"
import { LogoTienda } from "../logo-tienda"
import type { PropsPreview } from "./tipos"

/** Pie de la mini tienda: eslogan, redes cargadas e insignia. */
export function PreviewFooter({ marca, nombre, celular }: PropsPreview) {
  const c = marca.contacto
  const iconos = [
    c.instagram && InstagramLogo, c.facebook && FacebookLogo, c.tiktok && TiktokLogo, c.whatsapp && WhatsappLogo, c.email && EnvelopeSimple,
  ].filter((x): x is typeof InstagramLogo => Boolean(x))
  return (
    <div className={cn("border-t border-border/60 bg-background", celular ? "px-4 py-8" : "flex items-start justify-between gap-10 px-10 py-10")}>
      <div className="max-w-[420px]">
        <LogoTienda nombre={nombre || "Tu tienda"} logoUrl={marca.logoUrl} />
        {marca.textos.eslogan && <p className="mt-3 text-sm font-medium text-foreground">{marca.textos.eslogan}</p>}
        {marca.textos.sobreNosotros && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{marca.textos.sobreNosotros}</p>}
        {iconos.length > 0 && (
          <div className="mt-4 flex gap-2">
            {iconos.map((I, i) => (
              <span key={i} className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground">
                <I className="size-4" />
              </span>
            ))}
          </div>
        )}
      </div>
      {marca.mostrarInsignia && (
        <span className={cn("inline-flex rounded-full border border-border px-3 py-1 text-xs text-muted-foreground", celular && "mt-6")}>
          Hecho con <b className="ml-1 text-foreground">MirrorIA</b>
        </span>
      )}
    </div>
  )
}
