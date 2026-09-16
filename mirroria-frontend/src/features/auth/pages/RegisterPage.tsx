import { AuthLayout } from "@/layouts/AuthLayout"
import { RegisterForm } from "../components/register-form"

export function RegisterPage() {
  return (
    <AuthLayout title="Creá tu cuenta" description="Reservá prendas y probátelas en sucursal.">
      <RegisterForm />
    </AuthLayout>
  )
}
