import { FieldDescription, FieldGroup } from "@/components/ui/field"
import type { Errores, FormRegistro } from "../../hooks/useRegistroTiendaForm"
import { CampoTexto } from "./campo-texto"

interface PasoCuentaProps {
  form: FormRegistro
  errores: Errores
  onAdmin: (campo: keyof FormRegistro["admin"], v: string) => void
}

/** Paso 3: la cuenta ADMIN (dueña de la tienda). */
export function PasoCuenta({ form, errores, onAdmin }: PasoCuentaProps) {
  return (
    <FieldGroup>
      <CampoTexto id="admin-nombre" label="Tu nombre completo" autoComplete="name" value={form.admin.fullName} onChange={(v) => onAdmin("fullName", v)} error={errores["admin.fullName"]} />
      <CampoTexto id="admin-email" label="Email" type="email" autoComplete="email" value={form.admin.email} onChange={(v) => onAdmin("email", v)} error={errores["admin.email"]} />
      <CampoTexto id="admin-password" label="Contraseña" type="password" autoComplete="new-password" value={form.admin.password} onChange={(v) => onAdmin("password", v)} error={errores["admin.password"]} />
      <FieldDescription>
        Con esta cuenta administrás la tienda {form.tienda.nombre || "nueva"}. Entrás siempre por /t/{form.tienda.slug || "tu-tienda"}/login.
      </FieldDescription>
    </FieldGroup>
  )
}
