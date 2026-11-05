import { useTienda } from "@/hooks/useTienda"
import { AuthLayout } from "@/layouts/AuthLayout"
import { LoginForm } from "../components/login-form"

export function LoginPage() {
  const { tienda } = useTienda()
  return (
    <AuthLayout title="Iniciar sesión" description={`Entrá a ${tienda?.nombre ?? "la tienda"} para ver tus reservas y compras.`}>
      <LoginForm />
    </AuthLayout>
  )
}
