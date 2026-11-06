#!/usr/bin/env python3
"""
QA Suite de Validación en Vivo: Fase 5 (BI y Dashboards por Rol)
MirrorIA: BI Ejecutivo y Operativo POS
"""

import json
import subprocess
import sys
import urllib.request
import urllib.error

API = "http://localhost:3000/api/v1"
NGINX_URL = "http://localhost/admin/dashboard"
TENANT = "tiendaria"

ok_count = 0
fail_count = 0

def check(name, cond, extra=""):
    global ok_count, fail_count
    if cond:
        print(f"PASS: {name}")
        ok_count += 1
    else:
        print(f"FAIL: {name} -> {extra}")
        fail_count += 1

def req(method, path, body=None, token=None, tenant=TENANT):
    url = f"{API}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if tenant:
        headers["X-Tenant"] = tenant
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {"raw": content}
        return e.code, parsed
    except Exception as e:
        return 0, {"error": str(e)}

def check_nginx():
    req = urllib.request.Request(NGINX_URL, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0

def main():
    print("=" * 60)
    print("INICIANDO AUDITORÍA EN VIVO DE FASE 5 (BI & DASHBOARDS)")
    print("=" * 60)

    # 1. Verificación Nginx Web
    st_nginx = check_nginx()
    check("Frontend Nginx /admin/dashboard responde HTTP 200", st_nginx == 200, f"Status: {st_nginx}")

    # 2. Login de roles
    s_admin, b_admin = req("POST", "/seguridad/auth/login", {"email": "admin@tiendaria.com", "password": "Tiendaria2026!"})
    check("Login ADMIN (admin@tiendaria.com / Tiendaria2026!) exitoso", s_admin == 200 and "accessToken" in b_admin, (s_admin, b_admin))
    token_admin = b_admin.get("accessToken")

    s_caj, b_caj = req("POST", "/seguridad/auth/login", {"email": "cajera.centro@mirroria.com", "password": "Mirroria2026!"})
    check("Login CAJERO (cajera.centro@mirroria.com / Mirroria2026!) exitoso", s_caj == 200 and "accessToken" in b_caj, (s_caj, b_caj))
    token_caj = b_caj.get("accessToken")
    caj_sucursal = b_caj.get("usuario", {}).get("sucursalId")

    s_enc, b_enc = req("POST", "/seguridad/auth/login", {"email": "encargada.centro@mirroria.com", "password": "Mirroria2026!"})
    check("Login ENCARGADO_SUCURSAL exitoso", s_enc == 200 and "accessToken" in b_enc, (s_enc, b_enc))
    token_enc = b_enc.get("accessToken")
    enc_sucursal = b_enc.get("usuario", {}).get("sucursalId")

    # 3. Dashboard Ejecutivo (ADMIN)
    s_ejec, b_ejec = req("GET", "/dashboard/ejecutivo?periodo=30d", token=token_admin)
    check("ADMIN accede a /dashboard/ejecutivo con HTTP 200", s_ejec == 200, (s_ejec, b_ejec))
    
    kpis = b_ejec.get("kpis", {})
    check("Dashboard Ejecutivo contiene KPIs requeridos (ingresos, ticket, rotacion, reservas, clientes)",
          all(k in kpis for k in ["ingresos", "ticketPromedio", "rotacionInventario", "conversionReservas", "clientesActivos"]),
          list(kpis.keys()))

    graficos = b_ejec.get("graficos", {})
    check("Dashboard Ejecutivo contiene gráficos requeridos (tendencia, pagos, topPrendas, topProveedores)",
          all(g in graficos for g in ["tendenciaIngresos", "distribucionPagos", "topPrendas", "topProveedores"]),
          list(graficos.keys()))

    plan_saas = b_ejec.get("planSaaS", {})
    check("Dashboard Ejecutivo contiene consumo de límites de plan SaaS",
          "limites" in plan_saas and "productos" in plan_saas["limites"] and "sucursales" in plan_saas["limites"],
          plan_saas)

    # 4. Dashboard Ejecutivo para ENCARGADO_SUCURSAL (debe acotar sucursal)
    otra_sucursal = "9361e51b-79f7-4a86-ac8c-39c3e23ae061"  # Tarija
    s_ejec_enc, b_ejec_enc = req("GET", f"/dashboard/ejecutivo?sucursalId={otra_sucursal}", token=token_enc)
    check("ENCARGADO accede a /dashboard/ejecutivo con HTTP 200", s_ejec_enc == 200, (s_ejec_enc, b_ejec_enc))
    res_suc_enc = b_ejec_enc.get("periodo", {}).get("sucursalId")
    check("ENCARGADO tiene sucursal fijada a la de su JWT (ignora spoofing)", res_suc_enc == enc_sucursal, f"Esperado: {enc_sucursal}, Recibido: {res_suc_enc}")

    # 4b. Validación de formato UUID
    s_invalid_uuid, b_invalid = req("GET", "/dashboard/ejecutivo?sucursalId=no-es-uuid", token=token_enc)
    check("Query param sucursalId que no es UUID es rechazado con 400", s_invalid_uuid == 400, s_invalid_uuid)

    # 5. Seguridad: CAJERO no puede acceder a /dashboard/ejecutivo
    s_ejec_caj, b_ejec_caj = req("GET", "/dashboard/ejecutivo", token=token_caj)
    check("CAJERO bloqueado de /dashboard/ejecutivo con 401/403", s_ejec_caj in [401, 403], s_ejec_caj)

    # 6. Dashboard Operativo POS (CAJERO)
    s_op_caj, b_op_caj = req("GET", "/dashboard/operativo", token=token_caj)
    check("CAJERO accede a /dashboard/operativo con HTTP 200", s_op_caj == 200, (s_op_caj, b_op_caj))
    
    op_suc = b_op_caj.get("sucursal", {}).get("id")
    check("Dashboard Operativo acota exactamente a la sucursal del cajero", op_suc == caj_sucursal, f"Esperado: {caj_sucursal}, Recibido: {op_suc}")

    kpis_hoy = b_op_caj.get("kpisHoy", {})
    check("Dashboard Operativo contiene KPIs del turno (ventas, cobrosPendientes, reservas, stock)",
          all(k in kpis_hoy for k in ["ventas", "cobrosPendientes", "reservas", "stock"]),
          list(kpis_hoy.keys()))

    # 7. Enforcement estricto de sucursal contra spoofing en /dashboard/operativo
    otra_sucursal = "9361e51b-79f7-4a86-ac8c-39c3e23ae061"  # Tarija
    s_spoof, b_spoof = req("GET", f"/dashboard/operativo?sucursalId={otra_sucursal}", token=token_caj)
    check("CAJERO pasando sucursalId externo responde 200 pero fuerza su sucursal del token",
          s_spoof == 200 and b_spoof.get("sucursal", {}).get("id") == caj_sucursal,
          b_spoof.get("sucursal"))

    # 8. Dashboard Operativo (ADMIN)
    s_op_adm, b_op_adm = req("GET", f"/dashboard/operativo?sucursalId={otra_sucursal}", token=token_admin)
    check("ADMIN puede inspeccionar cualquier sucursal en /dashboard/operativo",
          s_op_adm == 200 and b_op_adm.get("sucursal", {}).get("id") == otra_sucursal,
          b_op_adm.get("sucursal"))

    # 9. Aislamiento Multi-tenant
    # Token de tiendaria contra tenant casa-andina debe ser rechazado
    s_tenant_leak, _ = req("GET", "/dashboard/ejecutivo", token=token_admin, tenant="casa-andina")
    check("Token de tiendaria no puede consultar dashboard de casa-andina (401/403)", s_tenant_leak in [401, 403], s_tenant_leak)

    print("=" * 60)
    print(f"RESULTADOS AUDITORÍA EN VIVO: {ok_count} PASSED, {fail_count} FAILED")
    print("=" * 60)
    if fail_count > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
