import { AuthLayout } from "@/layouts/AuthLayout"
import { LoginForm } from "../components/login-form"

export function LoginPage() {
  return (
    <AuthLayout title="Iniciar sesión" description="Entrá para ver tus reservas y compras.">
      <LoginForm />
    </AuthLayout>
  )
}
