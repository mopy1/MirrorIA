const fmt = new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "short", year: "numeric" })

export function formatFecha(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : fmt.format(d)
}
