import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PREGUNTAS } from "./preguntas-frecuentes.data"

/** Preguntas frecuentes (`/#preguntas`): una columna, accordion de shadcn. */
export function PreguntasFrecuentes() {
  return (
    <section id="preguntas" className="scroll-mt-20 py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Preguntas frecuentes</h2>
        <Accordion className="mt-8">
          {PREGUNTAS.map((q) => (
            <AccordionItem key={q.p} value={q.p}>
              <AccordionTrigger className="py-5 text-base font-medium">{q.p}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">{q.r}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
