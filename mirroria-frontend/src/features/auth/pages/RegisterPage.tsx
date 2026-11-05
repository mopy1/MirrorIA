import { useTienda } from "@/hooks/useTienda"
import { AuthLayout } from "@/layouts/AuthLayout"
import { RegisterForm } from "../components/register-form"

export function RegisterPage() {
  const { tienda } = useTienda()
  return (
    <AuthLayout
      title="Creá tu cuenta"
      description={`Tu cuenta es de ${tienda?.nombre ?? "esta tienda"}: reservá prendas y probátelas en sucursal.`}
    >
      <RegisterForm />
    </AuthLayout>
  )
}
