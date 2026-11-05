import { CheckCircle } from "@phosphor-icons/react"
import { ErrorConPlan } from "@/components/common/ErrorConPlan"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { MiMarcaDto } from "@/types/marca.types"
import { useBloqueoSalida } from "../hooks/useBloqueoSalida"
import { useBorradorMarca } from "../hooks/useBorradorMarca"
import { useGuardarMarca } from "../hooks/useGuardarMarca"
import { useProductosPreview } from "../hooks/useProductosPreview"
import { paraGuardar } from "../lib/borrador"
import { AparienciaCabecera } from "./apariencia-cabecera"
import { AparienciaTabs } from "./apariencia-tabs"
import { BarraGuardado } from "./barra-guardado"
import { PanelVistaPrevia } from "./panel-vista-previa"
import { RestablecerMenu } from "./restablecer-menu"

/** Editor cargado: formulario + vista previa en vivo + guardar/restablecer. */
export function EditorApariencia({ mi, onActualizado }: { mi: MiMarcaDto; onActualizado: (mi: MiMarcaDto) => void }) {
  const editor = useBorradorMarca(mi)
  const accion = useGuardarMarca(onActualizado)
  const productos = useProductosPreview()
  useBloqueoSalida(editor.sucio)

  return (
    <>
      <AparienciaCabecera mi={mi} acciones={<RestablecerMenu enCurso={accion.enCurso === "restablecer"} onConfirmar={accion.restablecer} />} />
      {/* 400 contraste/validación, 403 tienda no disponible o 409 "Tu plan ... no incluye" (con "Ver mi plan"). */}
      <ErrorConPlan mensaje={accion.error} />
      {accion.guardadoOk && !editor.sucio && (
        <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <CheckCircle weight="fill" />
          <AlertDescription className="text-inherit">Listo. Tu tienda ya se ve así para tus clientas.</AlertDescription>
        </Alert>
      )}
      <div className="lg:hidden"><PanelVistaPrevia marca={editor.vista} nombre={editor.vista.nombre} productos={productos} sucio={editor.sucio} /></div>
      <AparienciaTabs editor={editor} mi={mi} vistaPrevia={<PanelVistaPrevia marca={editor.vista} nombre={editor.vista.nombre} productos={productos} sucio={editor.sucio} />} />
      <BarraGuardado
        visible={editor.sucio}
        guardando={accion.enCurso === "guardar"}
        valido={editor.valido}
        onDescartar={editor.descartar}
        onGuardar={() => accion.guardar(paraGuardar(editor.borrador))}
      />
    </>
  )
}
