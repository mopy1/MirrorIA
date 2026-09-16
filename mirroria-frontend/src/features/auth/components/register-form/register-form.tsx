import { zodResolver } from "@hookform/resolvers/zod"
import { WarningCircle } from "@phosphor-icons/react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { z } from "zod"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRegister } from "../../hooks/useRegister"

const registerSchema = z.object({
  fullName: z.string().min(2, "Ingresá tu nombre completo"),
  email: z.string().min(1, "Ingresá tu email").email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { submit, isLoading, error } = useRegister()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={!!errors.fullName}>
          <FieldLabel htmlFor="fullName">Nombre completo</FieldLabel>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
          <FieldError errors={[errors.fullName]} />
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={isLoading}>
        {isLoading ? "Creando cuenta..." : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
          Iniciá sesión
        </Link>
      </p>
    </form>
  )
}
