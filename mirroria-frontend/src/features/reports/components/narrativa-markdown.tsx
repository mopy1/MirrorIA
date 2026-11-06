import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "cn"

/** Tipografía del análisis de la IA: misma familia que la app, jerarquía corta (modo Operate). */
const COMPONENTES: Components = {
  h1: ({ children }) => <h3 className="mt-5 text-sm font-semibold text-foreground first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-5 text-sm font-semibold text-foreground first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-4 text-sm font-semibold text-foreground first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-4 text-sm font-medium text-foreground first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="mt-2.5 first:mt-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mt-2.5 list-disc space-y-1.5 pl-5 marker:text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2.5 list-decimal space-y-1.5 pl-5 marker:text-muted-foreground marker:tabular-nums">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">{children}</code>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-border" />,
  blockquote: ({ children }) => <blockquote className="mt-2.5 border-l border-border pl-3 text-muted-foreground">{children}</blockquote>,
  table: ({ children }) => (
    <div className="mt-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-xs tabular-nums">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-border bg-muted/50 px-3 py-2 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-b border-border/60 px-3 py-1.5">{children}</td>,
}

interface NarrativaMarkdownProps {
  texto: string
  /** `compacto` para burbujas del chat (texto más chico). */
  compacto?: boolean
  className?: string
}

/** Renderiza el markdown de la IA (GFM) con estilos propios; nunca HTML crudo (react-markdown no lo ejecuta). */
export function NarrativaMarkdown({ texto, compacto, className }: NarrativaMarkdownProps) {
  return (
    <div
      className={cn(
        "max-w-[72ch] text-pretty text-foreground/85",
        compacto ? "text-[13px] leading-relaxed" : "text-sm leading-relaxed sm:text-[15px] sm:leading-7",
        className,
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTES}>
        {texto}
      </Markdown>
    </div>
  )
}
