import { EnvelopeSimple, FacebookLogo, InstagramLogo, TiktokLogo, WhatsappLogo, type Icon } from "@phosphor-icons/react"
import type { MarcaPublica } from "@/types/marca.types"

function redes(c: MarcaPublica["contacto"]): { label: string; href: string; icono: Icon }[] {
  const lista: { label: string; href: string | null; icono: Icon }[] = [
    { label: "Instagram", href: c.instagram && `https://instagram.com/${c.instagram}`, icono: InstagramLogo },
    { label: "Facebook", href: c.facebook && `https://facebook.com/${c.facebook}`, icono: FacebookLogo },
    { label: "TikTok", href: c.tiktok && `https://www.tiktok.com/@${c.tiktok}`, icono: TiktokLogo },
    { label: "WhatsApp", href: c.whatsapp && `https://wa.me/${c.whatsapp.replace(/^\+/, "")}`, icono: WhatsappLogo },
    { label: "Email", href: c.email && `mailto:${c.email}`, icono: EnvelopeSimple },
  ]
  return lista.filter((r): r is { label: string; href: string; icono: Icon } => Boolean(r.href))
}

/** Íconos de redes y contacto de la tienda: solo los que la dueña cargó. */
export function RedesTienda({ contacto }: { contacto: MarcaPublica["contacto"] }) {
  const lista = redes(contacto)
  if (lista.length === 0) return null
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {lista.map((r) => (
        <li key={r.label}>
          <a
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={r.label}
            className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <r.icono className="size-4" />
          </a>
        </li>
      ))}
    </ul>
  )
}
