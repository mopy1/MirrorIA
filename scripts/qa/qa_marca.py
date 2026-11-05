"""QA de la MARCA por tienda y del panel de plataforma (Fase 1b, spec §G.2) contra la API real.

Registra 3 tiendas qa-m-* (A Básico, B Cadena, C con paleta oceano) y verifica: aislamiento
(nadie lee ni escribe la marca de otra), roles, validación de URLs y contraste, límites por
nivel de plan, recorte al bajar de plan, defaults del alta, moderación de la plataforma y que
las métricas por tienda sean solo agregados.

Crea datos de verdad: correr SOLO contra la BD local y restaurar el dump después. Usa 4 de las
5 altas por hora del limitador por IP (reiniciar el backend antes). Requiere PLATAFORMA_PASSWORD.
    API=http://localhost:3100/api/v1 python3 scripts/qa/qa_marca.py
"""
import json
import os
import urllib.request
import uuid

API = os.environ.get("API", "http://localhost:3000/api/v1")
PLAT_EMAIL = os.environ.get("PLATAFORMA_EMAIL", "plataforma@mirroria.com")
PLAT_PASS = os.environ.get("PLATAFORMA_PASSWORD", "Mirroria2026!")
ok = fail = 0


def req(m, path, body=None, tok=None, tenant=None):
    headers = {"Content-Type": "application/json"}
    if tok:
        headers["Authorization"] = "Bearer " + tok
    if tenant:
        headers["X-Tenant"] = tenant
    r = urllib.request.Request(API + path, method=m, headers=headers,
                               data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read()
        return e.code, json.loads(raw) if raw else None


def check(name, cond, extra=""):
    global ok, fail
    print(("PASS " if cond else "FAIL ") + name + ("" if cond else f"  -> {extra}"))
    ok += bool(cond)
    fail += (not cond)


def msg(b):
    m = (b or {}).get("message", "")
    return " ".join(m) if isinstance(m, list) else str(m)


sufijo = uuid.uuid4().hex[:6]
SA, SB, SC = f"qa-m-a-{sufijo}", f"qa-m-b-{sufijo}", f"qa-m-c-{sufijo}"
ciudad = {c["nombre"]: c["id"] for c in req("GET", "/sucursales/ciudades")[1]}["La Paz"]


def registrar(slug, plan, paleta=None):
    tienda = {"nombre": f"Tienda {slug}", "slug": slug}
    if paleta:
        tienda["paleta"] = paleta
    return req("POST", "/saas/tiendas", {
        "planCodigo": plan, "tienda": tienda,
        "sucursal": {"nombre": "Central", "direccion": "Calle Falsa 123", "ciudadId": ciudad},
        "admin": {"fullName": f"Dueña {slug}", "email": f"duena@{slug}.test", "password": "Qa123456!"},
    })


# ------------------------------------------------------------ alta y defaults
s, a = registrar(SA, "basico")
check("alta A (Básico) -> 201 con marca inicial grafito en la respuesta",
      s == 201 and a["tienda"]["marca"]["colorPrimario"] == "#26282E", (s, a))
s, b = registrar(SB, "cadena")
check("alta B (Cadena) -> 201", s == 201, (s, b))
s, c = registrar(SC, "basico", "oceano")
check("alta C con paleta oceano -> marca #0E4D74", s == 201 and c["tienda"]["marca"]["colorPrimario"] == "#0E4D74", (s, c))
s, bad = registrar(f"qa-m-x-{sufijo}", "basico", "neon")
check("paleta inexistente -> 400 y no queda la tienda", s == 400 and
      req("GET", f"/saas/tiendas/disponibilidad?slug=qa-m-x-{sufijo}")[1]["disponible"], (s, bad))
TA, TB = a["accessToken"], b["accessToken"]
s, plat = req("POST", "/seguridad/auth/login", {"email": PLAT_EMAIL, "password": PLAT_PASS})
TP = plat["accessToken"]

s, m = req("GET", "/saas/mi-marca", tok=TA)
check("ADMIN A GET /saas/mi-marca -> 200, nivel ESENCIAL, estilo bloqueado",
      s == 200 and m["nivel"] == "ESENCIAL" and not m["permitido"]["estilo"] and m["slug"] == SA, (s, m))
base = dict(m["guardada"], nombre=f"Tienda {SA}")
s, _ = req("GET", "/saas/tiendas/" + SA)
check("actividad: el alta dejó evento ALTA", any(
    e["tipo"] == "ALTA" for e in req("GET", f"/saas/plataforma/inquilinos/{a['tienda']['id']}", tok=TP)[1]["actividad"]))

# ------------------------------------------------------------ validaciones
s, r = req("PUT", "/saas/mi-marca", dict(base, colorPrimario="#F5D90A"), TA)
check("principal #F5D90A en CLARO -> 400 con el ratio", s == 400 and "contraste" in msg(r) and ":1" in msg(r), (s, r))
for url in ["javascript:alert(1)", "http://x.com/logo.png", "data:image/png;base64,AAAA", "https://x.com/a\".png"]:
    s, r = req("PUT", "/saas/mi-marca", dict(base, logoUrl=url), TA)
    check(f"logoUrl {url[:20]} -> 400", s == 400, (s, r))
s, r = req("PUT", "/saas/mi-marca", dict(base, fuente="comic-sans"), TA)
check("fuente fuera de la lista -> 400", s == 400, (s, r))
s, r = req("PUT", "/saas/mi-marca", dict(base, hero=dict(base["hero"], ctaDestino="https://evil.com")), TA)
check("ctaDestino libre (open redirect) -> 400", s == 400, (s, r))

# ------------------------------------------------------------ límites por nivel
s, r = req("PUT", "/saas/mi-marca", dict(base, fuente="playfair"), TA)
check("Básico cambia la fuente -> 409 con 'plan'", s == 409 and "plan" in msg(r), (s, r))
s, r = req("PUT", "/saas/mi-marca", dict(base, modo="OSCURO", colorPrimario="#E3C14B"), TA)
check("Básico modo oscuro -> 409", s == 409, (s, r))
s, r = req("PUT", "/saas/mi-marca", dict(base, mostrarInsignia=False), TA)
check("Básico quita la insignia -> 409", s == 409, (s, r))
s, r = req("PUT", "/saas/mi-marca", dict(base, nombre="Boutique Ámbar", colorPrimario="#9c3d24",
                                          textos={"eslogan": "Hecho a mano", "sobreNosotros": ""}), TA)
check("Básico cambia nombre, color y eslogan -> 200 (hex normalizado, '' -> null)",
      s == 200 and r["guardada"]["colorPrimario"] == "#9C3D24" and r["nombre"] == "Boutique Ámbar"
      and r["guardada"]["textos"]["sobreNosotros"] is None, (s, r))
s, t = req("GET", "/saas/tiendas/" + SA)
check("público de A refleja nombre y color nuevos", t["nombre"] == "Boutique Ámbar" and t["marca"]["colorPrimario"] == "#9C3D24", t)

# ------------------------------------------------------------ aislamiento y roles
mb_antes = req("GET", "/saas/tiendas/" + SB)[1]["marca"]
s, _ = req("GET", "/saas/mi-marca", tok=TA, tenant=SB)
check("token de A con X-Tenant B: GET mi-marca -> 403", s == 403, s)
s, _ = req("PUT", "/saas/mi-marca", dict(base, colorPrimario="#000000"), TA, SB)
check("token de A con X-Tenant B: PUT mi-marca -> 403", s == 403, s)
check("la marca de B no cambió", req("GET", "/saas/tiendas/" + SB)[1]["marca"] == mb_antes)
s, cli = req("POST", "/seguridad/auth/register", {"email": f"cli@{SA}.test", "password": "Qa123456!", "fullName": "Clienta"}, tenant=SA)
s, _ = req("GET", "/saas/mi-marca", tok=cli["accessToken"])
check("CUSTOMER -> 403", s == 403, s)
s, _ = req("GET", "/saas/mi-marca", tok=TP)
check("DUENO_PLATAFORMA en /saas/mi-marca -> 403", s == 403, s)
s, _ = req("GET", "/saas/mi-marca")
check("sin token -> 401", s == 401, s)
s, _ = req("GET", "/saas/plataforma/dashboard", tok=TA)
check("ADMIN de tienda en /saas/plataforma/dashboard -> 403", s == 403, s)

# ------------------------------------------------------------ Cadena, bajar de plan, moderación
s, mb = req("GET", "/saas/mi-marca", tok=TB)
full = dict(mb["guardada"], nombre=f"Tienda {SB}", fuente="playfair", modo="OSCURO", colorPrimario="#E3C14B",
            mostrarInsignia=False, faviconUrl="/images/marcas/mirroria.svg")
s, r = req("PUT", "/saas/mi-marca", full, TB)
check("Cadena: playfair + OSCURO + amarillo + sin insignia + favicon -> 200", s == 200, (s, r))
ID_B = b["tienda"]["id"]
req("PATCH", f"/saas/plataforma/inquilinos/{ID_B}/plan", {"planCodigo": "basico"}, TP)
t = req("GET", "/saas/tiendas/" + SB)[1]["marca"]
check("bajó a Básico: lo público vuelve a geist/CLARO/insignia/sin favicon",
      t["fuente"] == "geist" and t["modo"] == "CLARO" and t["mostrarInsignia"] and t["faviconUrl"] is None, t)
s, mb = req("GET", "/saas/mi-marca", tok=TB)
check("bajó a Básico: lo guardado se conserva", mb["guardada"]["fuente"] == "playfair" and mb["efectiva"]["fuente"] == "geist", mb)
s, r = req("PUT", "/saas/mi-marca", dict(full, textos={"eslogan": "sigo", "sobreNosotros": None}), TB)
check("bajó a Básico: reenviar lo guardado + otro cambio -> 200 (no 409)", s == 200, (s, r))
s, d = req("POST", f"/saas/plataforma/inquilinos/{ID_B}/marca/restablecer", {"seccion": "COLORES", "motivo": "colores ilegibles"}, TP)
check("plataforma restablece COLORES -> 200 y queda evento con el motivo",
      s == 200 and d["marcaCompleta"]["colorPrimario"] == "#26282E"
      and d["actividad"][0]["tipo"] == "MARCA_RESTABLECIDA" and "colores ilegibles" in d["actividad"][0]["detalle"], (s, d))
s, _ = req("POST", f"/saas/plataforma/inquilinos/{ID_B}/marca/restablecer", {"seccion": "COLORES", "motivo": "x"}, TP)
check("restablecer sin motivo suficiente -> 400", s == 400, s)
s, r = req("POST", "/saas/mi-marca/restablecer", {"seccion": "TODO"}, TB)
check("la dueña restablece TODO -> 200 (nombre intacto)", s == 200 and r["nombre"] == f"Tienda {SB}", (s, r))

# ------------------------------------------------------------ métricas y dashboard
s, mt = req("GET", f"/saas/plataforma/inquilinos/{a['tienda']['id']}/metricas", tok=TP)
txt = json.dumps(mt)
check("métricas de A -> 200 solo agregados (sin email/nombres/ids)",
      s == 200 and mt["clientas"] == 1 and len(mt["ventasPorDia"]) == 30 and "@" not in txt and '"id"' not in txt, (s, mt))
s, _ = req("GET", f"/saas/plataforma/inquilinos/{uuid.uuid4()}/metricas", tok=TP)
check("métricas de una tienda inexistente -> 404", s == 404, s)
s, dsh = req("GET", "/saas/plataforma/dashboard", tok=TP)
check("dashboard -> 200 con 12 meses y la actividad reciente",
      s == 200 and len(dsh["altasPorMes"]) == 12 and len(dsh["actividad"]) == 10, (s, dsh))
s, _ = req("GET", "/saas/plataforma/actividad?limite=500", tok=TP)
check("actividad?limite=500 -> 400", s == 400, s)
s, est = req("GET", "/saas/estadisticas")
check("estadísticas públicas -> 200", s == 200 and est["tiendasAbiertas"] >= 3, (s, est))

print(f"\n{ok} ok, {fail} fallos  (tiendas {SA} / {SB} / {SC})")
