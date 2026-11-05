import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ROLES_CONFIG } from "./usuario-rol-editor.data"

/** Selector de rol con la descripción de cada uno. */
export function RolField({ role, onRoleChange }: { role: string; onRoleChange: (role: string) => void }) {
  return (
    <Field>
      <FieldLabel>Rol en el sistema</FieldLabel>
      <Select value={role} onValueChange={(v) => onRoleChange(v as string)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar rol">{(v: string) => ROLES_CONFIG[v]?.label ?? v}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLES_CONFIG).map(([key, item]) => (
            <SelectItem key={key} value={key}>
              <div className="flex flex-col py-0.5">
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
