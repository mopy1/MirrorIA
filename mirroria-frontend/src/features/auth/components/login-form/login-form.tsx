import { zodResolver } from "@hookform/resolvers/zod"
import { WarningCircle } from "@phosphor-icons/react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { z } from "zod"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useLogin } from "../../hooks/useLogin"

const loginSchema = z.object({
  email: z.string().min(1, "Ingresá tu email").email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const { submit, isLoading, error } = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
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
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={isLoading}>
        {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{" "}
        <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
          Registrate
        </Link>
      </p>
    </form>
  )
}
