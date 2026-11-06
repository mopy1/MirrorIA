#!/usr/bin/env python3
"""
QA Suite de Validación en Vivo: Fase 6 (Machine Learning Orientado a KPIs de Negocio)
MirrorIA: M1 Demanda (Random Forest), M2 No-Show (Logistic Regression),
M3 RFM (K-Means), M4 Anomalías (Isolation Forest) y Rigor Científico.
"""

import json
import subprocess
import sys
import urllib.request
import urllib.error

API = "http://localhost:3000/api/v1"
ML_SERVICE = "http://localhost:8002"
NGINX_URL = "http://localhost/admin/ml"
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

def req(method, path, body=None, token=None, tenant=TENANT, base=API):
    url = f"{base}{path}"
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
            h_fallback = resp.headers.get("X-ML-Fallback")
            return resp.status, json.loads(content) if content else {}, h_fallback
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {"raw": content}
        return e.code, parsed, e.headers.get("X-ML-Fallback")
    except Exception as e:
        return 0, {"error": str(e)}, None

def main():
    print("=" * 60)
    print("INICIANDO AUDITORÍA EN VIVO DE FASE 6 (MACHINE LEARNING)")
    print("=" * 60)

    # 1. Microservicio Python en :8002
    s_ml, b_ml, _ = req("GET", "/health", base=ML_SERVICE, tenant=None)
    check("Microservicio mirroria-ml :8002 responde HTTP 200", s_ml == 200, (s_ml, b_ml))
    check("Microservicio mirroria-ml tiene los 4 modelos cargados en memoria",
          b_ml.get("modelos_cargados", {}).get("demanda_rf") is True and
          b_ml.get("modelos_cargados", {}).get("noshow_logreg") is True and
          b_ml.get("modelos_cargados", {}).get("rfm_kmeans") is True and
          b_ml.get("modelos_cargados", {}).get("anomalias_iforest") is True,
          b_ml.get("modelos_cargados"))

    # 2. Login ADMIN
    s_admin, b_admin, _ = req("POST", "/seguridad/auth/login", {"email": "admin@mirroria.com", "password": "Mirroria2026!"})
    check("Login ADMIN (admin@mirroria.com / Mirroria2026!) exitoso", s_admin == 200 and "accessToken" in b_admin, (s_admin, b_admin))
    token_admin = b_admin.get("accessToken")

    # 3. M1 Demanda
    s_dem, b_dem, h_dem = req("GET", "/ml/kpis/demanda?dias=30", token=token_admin)
    check("M1 Demanda /ml/kpis/demanda responde 200", s_dem == 200, (s_dem, b_dem))
    check("M1 Cabecera X-ML-Fallback es 'false' (servicio activo)", h_dem == "false", f"Header: {h_dem}")
    check("M1 Predicciones contienen unidades y sugerencias de reposición",
          len(b_dem.get("predicciones", [])) > 0 and "reabastecimiento_sugerido" in b_dem["predicciones"][0],
          b_dem)

    # 4. M2 No-Show
    s_ns, b_ns, h_ns = req("GET", "/ml/kpis/no-show", token=token_admin)
    check("M2 No-Show /ml/kpis/no-show responde 200", s_ns == 200, (s_ns, b_ns))
    check("M2 Cabecera X-ML-Fallback es 'false'", h_ns == "false", f"Header: {h_ns}")
    check("M2 Evaluaciones contienen probabilidad y clasificación de riesgo",
          len(b_ns.get("evaluaciones", [])) > 0 and "probabilidad_no_show" in b_ns["evaluaciones"][0],
          b_ns)

    # 5. M3 RFM
    s_rfm, b_rfm, h_rfm = req("GET", "/ml/kpis/rfm", token=token_admin)
    check("M3 RFM /ml/kpis/rfm responde 200", s_rfm == 200, (s_rfm, b_rfm))
    check("M3 Cabecera X-ML-Fallback es 'false'", h_rfm == "false", f"Header: {h_rfm}")
    check("M3 Clusters RFM incluyen VIPs, Nuevas, Dormidas y Ocasionales",
          "VIPS_LEALES" in b_rfm.get("distribucion_clusters", {}),
          b_rfm.get("distribucion_clusters"))

    # 6. M4 Anomalías
    s_anom, b_anom, h_anom = req("GET", "/ml/kpis/anomalias", token=token_admin)
    check("M4 Anomalías /ml/kpis/anomalias responde 200", s_anom == 200, (s_anom, b_anom))
    check("M4 Cabecera X-ML-Fallback es 'false'", h_anom == "false", f"Header: {h_anom}")
    check("M4 Diagnósticos contienen score de anomalía y detección",
          len(b_anom.get("diagnosticos", [])) > 0 and "score_anomalia" in b_anom["diagnosticos"][0],
          b_anom)

    # 7. Ficha de Métricas Científicas
    s_met, b_met, h_met = req("GET", "/ml/modelos/metricas", token=token_admin)
    check("Métricas Modelos /ml/modelos/metricas responde 200", s_met == 200, (s_met, b_met))
    modelos = b_met.get("modelos", {})
    check("Ficha Científica contiene citas de Breiman, Cox, MacQueen y Liu",
          "Breiman" in modelos.get("M1_demanda_random_forest", {}).get("cita_academica", "") and
          "Cox" in modelos.get("M2_noshow_logistic_regression", {}).get("cita_academica", "") and
          "MacQueen" in modelos.get("M3_rfm_kmeans", {}).get("cita_academica", "") and
          "Liu" in modelos.get("M4_anomalias_isolation_forest", {}).get("cita_academica", ""),
          modelos)

    # 8. Seguridad RBAC: CUSTOMER no puede consultar endpoints ML
    s_cust_login, b_cust_login, _ = req("POST", "/seguridad/auth/login", {"email": "clienta@mirroria.com", "password": "Mirroria2026!"})
    token_cust = b_cust_login.get("accessToken")
    s_cust_dem, _, _ = req("GET", "/ml/kpis/demanda", token=token_cust)
    check("CUSTOMER bloqueado de /ml/kpis/demanda con HTTP 403", s_cust_dem == 403, s_cust_dem)

    # 9. Multi-tenancy: token de tiendaria contra tenant casa-andina es rechazado con 403
    s_cross, b_cross, _ = req("GET", "/ml/kpis/demanda", token=token_admin, tenant="casa-andina")
    check("Aislamiento multi-tenant: token de tiendaria rechazado en casa-andina con HTTP 403", s_cross == 403, (s_cross, b_cross))

    # 10. Frontend Nginx /admin/ml responde 200
    req_fe = urllib.request.Request(NGINX_URL, method="GET")
    try:
        with urllib.request.urlopen(req_fe) as resp:
            st_fe = resp.status
    except urllib.error.HTTPError as e:
        st_fe = e.code
    except Exception:
        st_fe = 0
    check("Frontend Nginx /admin/ml responde HTTP 200", st_fe == 200, f"Status: {st_fe}")

    print("=" * 60)
    print(f"RESULTADOS AUDITORÍA ML EN VIVO: {ok_count} PASSED, {fail_count} FAILED")
    print("=" * 60)
    if fail_count > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
