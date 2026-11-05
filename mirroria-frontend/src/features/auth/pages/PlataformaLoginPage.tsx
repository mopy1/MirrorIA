import { Link } from "react-router-dom"
import { useTemaTiendaria } from "@/hooks/useTemaTiendaria"
import { AuthLayout } from "@/layouts/AuthLayout"
import { LoginForm } from "../components/login-form"

/** `/plataforma/login`: cuenta DUENO_PLATAFORMA (sin tienda). */
export function PlataformaLoginPage() {
  useTemaTiendaria()
  return (
    <AuthLayout title="Acceso plataforma" description="Administración de tiendas, planes y ciudades de Tiendaria.">
      <LoginForm modo="plataforma" />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Tenés una tienda?{" "}
        <Link to="/entrar" className="font-medium text-foreground underline underline-offset-4">
          Entrá por la dirección de tu tienda
        </Link>
      </p>
    </AuthLayout>
  )
}
