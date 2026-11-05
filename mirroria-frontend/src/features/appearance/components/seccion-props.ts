import type { MiMarcaDto } from "@/types/marca.types"
import type { EditorMarca } from "../hooks/useBorradorMarca"

export interface SeccionProps {
  editor: EditorMarca
  mi: MiMarcaDto
}
