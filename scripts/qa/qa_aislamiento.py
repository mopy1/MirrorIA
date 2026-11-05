"""Prueba de AISLAMIENTO multi-tenant (Fase 1 SaaS, spec §9.3) contra la API real.

Registra dos tiendas nuevas (A en plan Cadena, B en Básico), le carga datos a A y
verifica con las credenciales de B que NINGÚN listado devuelve nada de A, que los
detalles y escrituras sobre ids de A dan 404, las referencias cruzadas, la IA, los
únicos por tienda, el contrato de la cabecera X-Tenant, la disponibilidad, los
límites del plan, la transacción del alta y la barrida global de vencidas.

Crea datos de verdad (tiendas, usuarias, ventas): correr SOLO contra la BD local y
restaurar o borrar después (ver README). Requiere PLATAFORMA_EMAIL/PASSWORD en el .env.
    API=http://localhost:3100/api/v1 python3 scripts/qa/qa_aislamiento.py
"""
import datetime as dt
import json
import os
import subprocess
import urllib.request
import uuid

API = os.environ.get("API", "http://localhost:3000/api/v1")
PLAT_EMAIL = os.environ.get("PLATAFORMA_EMAIL", "plataforma@mirroria.com")
PLAT_PASS = os.environ.get("PLATAFORMA_PASSWORD", "Mirroria2026!")


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


def sql(q):
    return subprocess.run(["docker", "exec", "mirroria_postgres", "psql", "-U", "mirroria", "-d", "mirroria_db",
                           "-tAc", q], capture_output=True, text=True).stdout.strip()


def local_ts(minutes):
    return (dt.datetime.now() + dt.timedelta(minutes=minutes)).strftime('%Y-%m-%d %H:%M:%S')


def iso(minutes):
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=minutes)).isoformat()


ok = 0
fail = 0


def check(name, cond, extra=""):
    global ok, fail
    print(("PASS " if cond else "FAIL ") + name + ("" if cond else f"  -> {extra}"))
    ok += bool(cond)
    fail += (not cond)


def must(s, b, esperado, que):
    assert s == esperado, (que, s, b)
    return b


# ---------------------------------------------------------------- preparación
sufijo = uuid.uuid4().hex[:6]
SA, SB = f"qa-a-{sufijo}", f"qa-b-{sufijo}"
ciudades = {c["nombre"]: c["id"] for c in req("GET", "/sucursales/ciudades")[1]}


def registrar_tienda(slug, plan, ciudad):
    return req("POST", "/saas/tiendas", {
        "planCodigo": plan,
        "tienda": {"nombre": f"Tienda {slug}", "slug": slug},
        "sucursal": {"nombre": "Casa central", "direccion": "Calle Falsa 123", "ciudadId": ciudades[ciudad]},
        "admin": {"fullName": f"Dueña {slug}", "email": f"duena@{slug}.test", "password": "Qa123456!"},
    })


s, ta = registrar_tienda(SA, "cadena", "La Paz")
check("alta de la tienda A (Cadena) -> 201 con JWT y TRIAL", s == 201 and ta["suscripcion"]["estado"] == "TRIAL"
      and ta["usuario"]["tenant"]["slug"] == SA, (s, ta))
s, tb = registrar_tienda(SB, "basico", "Cochabamba")
check("alta de la tienda B (Básico) -> 201", s == 201, (s, tb))
TA, TB = ta["accessToken"], tb["accessToken"]
SUC_A, SUC_B = ta["sucursalId"], tb["sucursalId"]
cats_b = req("GET", "/catalogo/categorias", tenant=SB)[1]
check("la tienda nueva trae las 5 categorías base", len(cats_b) == 5, cats_b)


def A(m, path, body=None):
    return req(m, path, body, TA, SA)


def B(m, path, body=None):
    return req(m, path, body, TB, SB)


ids_a = {"sucursal": SUC_A, "admin": ta["usuario"]["id"]}
prov = must(*A("POST", "/proveedores", {"razonSocial": "Proveedor A"}), 201, "proveedor A")
ids_a["proveedor"] = prov["id"]
temp = must(*A("POST", "/catalogo/temporadas", {"nombre": "Invierno A", "fechaInicio": "2026-06-01",
                                                "fechaFin": "2026-12-31"}), 201, "temporada A")
ids_a["temporada"] = temp["id"]
col = must(*A("POST", "/catalogo/colecciones", {"nombre": "Colección A", "temporadaId": temp["id"],
                                                "proveedorId": prov["id"]}), 201, "colección A")
ids_a["coleccion"] = col["id"]
cat_a = A("GET", "/catalogo/categorias")[1][0]
talla_a = A("GET", "/catalogo/tallas")[1][0]
color_a = A("GET", "/catalogo/colores")[1][0]
ids_a.update(categoria=cat_a["id"], talla=talla_a["id"], color=color_a["id"])
SLUG_COMUN, SKU_COMUN = f"vestido-lino-{sufijo}", f"VL-{sufijo}"
prod = must(*A("POST", "/catalogo/productos", {"categoriaId": cat_a["id"], "coleccionId": col["id"],
                                               "titulo": "Vestido A", "slug": SLUG_COMUN, "precioCents": 15000}),
            201, "producto A")
ids_a["producto"] = prod["id"]
var = must(*A("POST", f"/catalogo/productos/{prod['id']}/variantes",
              {"tallaId": talla_a["id"], "colorId": color_a["id"], "sku": SKU_COMUN}), 201, "variante A")
ids_a["variante"] = var["id"]
suc2 = must(*A("POST", "/sucursales", {"nombre": "Sucursal 2 A", "direccion": "Av. Arce 456",
                                       "ciudadId": ciudades["Santa Cruz"]}), 201, "2a sucursal A")
ids_a["sucursal2"] = suc2["id"]
must(*A("POST", "/inventario/ajustes", {"varianteId": var["id"], "sucursalId": SUC_A, "cantidad": 10,
                                        "motivo": "stock inicial QA"}), 201, "ajuste A")
oc = must(*A("POST", "/inventario/ordenes-compra", {"proveedorId": prov["id"], "sucursalDestinoId": SUC_A,
                                                    "items": [{"varianteId": var["id"], "cantidadPedida": 4}]}),
          201, "orden A")
ids_a["orden"] = oc["id"]
COD_A, COD_COMUN = f"SOLOA{sufijo}".upper(), f"BIENVENIDA{sufijo}".upper()
cup = must(*A("POST", "/promociones/cupones", {"codigo": COD_A, "tipoDescuento": "PORCENTAJE", "valor": 10,
                                               "fechaInicio": iso(-60), "fechaFin": iso(60 * 24 * 30)}),
           201, "cupón A")
ids_a["cupon"] = cup["id"]
must(*A("POST", "/promociones/cupones", {"codigo": COD_COMUN, "tipoDescuento": "PORCENTAJE", "valor": 5,
                                         "fechaInicio": iso(-60), "fechaFin": iso(60 * 24 * 30)}), 201, "cupón común A")

EMAIL_CLIENTA = f"clienta.{sufijo}@qa.test"
s, ca = req("POST", "/seguridad/auth/register", {"email": EMAIL_CLIENTA, "password": "Qa123456!",
                                                 "fullName": "Clienta A"}, tenant=SA)
s2, cb = req("POST", "/seguridad/auth/register", {"email": EMAIL_CLIENTA, "password": "Qa123456!",
                                                  "fullName": "Clienta B"}, tenant=SB)
check("mismo email de clienta en A y en B -> 201 en las dos", s == 201 and s2 == 201, (s, s2))
TCA, CA = ca["accessToken"], ca["usuario"]["id"]
TCB, CB = cb["accessToken"], cb["usuario"]["id"]
ids_a["clienta"] = CA
must(*req("POST", f"/ventas/carrito/{CA}/items", {"varianteId": var["id"], "cantidad": 1}, TCA, SA), 201, "carrito A")
venta = must(*req("POST", f"/ventas/carrito/{CA}/checkout", {"sucursalId": SUC_A, "canal": "WEB"}, TCA, SA),
             201, "checkout A")
ids_a["venta"] = venta["id"]
pago = must(*req("POST", f"/pagos/ventas/{venta['id']}/manual", {"metodo": "EFECTIVO"}, TCA, SA), 201, "pago A")
ids_a["pago"] = pago["pagoId"]
must(*A("POST", f"/pagos/{pago['pagoId']}/confirmar"), 200, "confirmar pago A")
res = must(*req("POST", "/reservas", {"sucursalId": SUC_A, "fechaHoraPrevista": iso(120),
                                      "items": [{"varianteId": var["id"], "cantidad": 1}]}, TCA, SA),
           201, "reserva A")
ids_a["reserva"] = res["id"]
# un pago manual PENDIENTE de A (para /pagos/pendientes y el confirmar cruzado)
must(*req("POST", f"/ventas/carrito/{CA}/items", {"varianteId": var["id"], "cantidad": 1}, TCA, SA), 201, "carrito A 2")
venta2 = must(*req("POST", f"/ventas/carrito/{CA}/checkout", {"sucursalId": SUC_A, "canal": "WEB"}, TCA, SA),
              201, "checkout A 2")
pago2 = must(*req("POST", f"/pagos/ventas/{venta2['id']}/manual", {"metodo": "EFECTIVO"}, TCA, SA), 201, "pago A 2")
ids_a.update(venta2=venta2["id"], pago2=pago2["pagoId"])
TID_A = ta["tienda"]["id"]
ia_id = str(uuid.uuid4())
sql(f"insert into interacciones_ia (id, tenant_id, usuario_id, tipo, input_text) "
    f"values ('{ia_id}', '{TID_A}', '{ta['usuario']['id']}', 'REPORTE_VOZ', 'qa aislamiento')")
ids_a["interaccion"] = ia_id
print(f"preparado: {len(ids_a)} ids de A")


def sin_ids_de_a(nombre, s, b):
    texto = json.dumps(b)
    fugas = [k for k, v in ids_a.items() if v in texto]
    check(f"B lista {nombre} -> sin nada de A", s == 200 and not fugas, (s, fugas or b))


# ---------------------------------------------------------------- listados
for ruta in ["/catalogo/productos", "/catalogo/categorias", "/catalogo/tallas", "/catalogo/colores",
             "/catalogo/temporadas", "/catalogo/colecciones", "/proveedores", "/sucursales", "/inventario",
             "/inventario/movimientos", "/inventario/ordenes-compra", "/ventas", "/reservas",
             "/promociones/cupones", "/pagos/pendientes", "/seguridad/usuarios", "/ia/interacciones"]:
    sin_ids_de_a(ruta, *B("GET", ruta))
sin_ids_de_a("/ventas/mias (clienta B)", *req("GET", "/ventas/mias", tok=TCB, tenant=SB))
sin_ids_de_a("/reservas/mias (clienta B)", *req("GET", "/reservas/mias", tok=TCB, tenant=SB))
sin_ids_de_a(f"carrito de la clienta B", *req("GET", f"/ventas/carrito/{CB}", tok=TCB, tenant=SB))

# ---------------------------------------------------------------- detalle por id de A
for ruta in [f"/catalogo/productos/{ids_a['producto']}", f"/proveedores/{ids_a['proveedor']}",
             f"/sucursales/{SUC_A}", f"/inventario/ordenes-compra/{ids_a['orden']}", f"/ventas/{ids_a['venta']}",
             f"/reservas/{ids_a['reserva']}", f"/promociones/cupones/{ids_a['cupon']}"]:
    s, b = B("GET", ruta)
    check(f"B GET {ruta.rsplit('/', 1)[0]}/<id de A> -> 404", s == 404, (s, b))

# ---------------------------------------------------------------- escrituras sobre ids de A
escrituras = [
    ("PATCH", f"/catalogo/productos/{ids_a['producto']}", {"titulo": "HACKEADO"}),
    ("POST", f"/catalogo/productos/{ids_a['producto']}/variantes",
     {"tallaId": ids_a["talla"], "colorId": ids_a["color"], "sku": "X-" + sufijo}),
    ("PATCH", f"/catalogo/colecciones/{ids_a['coleccion']}", {"nombre": "HACKEADA"}),
    ("PATCH", f"/inventario/ordenes-compra/{ids_a['orden']}/recibir",
     {"items": [{"varianteId": ids_a["variante"], "cantidadRecibida": 1}]}),
    ("PATCH", f"/inventario/ordenes-compra/{ids_a['orden']}/cancelar", None),
    ("POST", "/inventario/ajustes", {"varianteId": ids_a["variante"], "sucursalId": SUC_A, "cantidad": -5,
                                     "motivo": "robo"}),
    ("PATCH", f"/reservas/{ids_a['reserva']}/estado", {"estado": "CANCELADA"}),
    ("PATCH", f"/promociones/cupones/{ids_a['cupon']}/estado", None),
    ("PATCH", f"/seguridad/usuarios/{CA}/rol", {"role": "ADMIN"}),
    ("PATCH", f"/seguridad/usuarios/{CA}/estado", {"isActive": False}),
    ("POST", f"/pagos/{ids_a['pago2']}/confirmar", None),
]
for m, ruta, body in escrituras:
    s, b = B(m, ruta, body)
    check(f"B {m} {ruta.replace(SUC_A, '<suc A>')} -> 404", s == 404, (s, b))
check("A relee su producto: intacto", A("GET", f"/catalogo/productos/{ids_a['producto']}")[1]["titulo"] == "Vestido A")
check("A relee su orden: sigue PENDIENTE", A("GET", f"/inventario/ordenes-compra/{ids_a['orden']}")[1]["estado"] == "PENDIENTE")
check("A relee su reserva: sigue PENDIENTE", A("GET", f"/reservas/{ids_a['reserva']}")[1]["estado"] == "PENDIENTE")
check("A relee su cupón: sigue activo", A("GET", f"/promociones/cupones/{ids_a['cupon']}")[1]["activo"] is True)
usu_a = {u["id"]: u for u in A("GET", "/seguridad/usuarios")[1]}
check("A relee su clienta: sigue CUSTOMER y activa", usu_a[CA]["role"] == "CUSTOMER" and usu_a[CA]["isActive"])
check("el stock de A no se movió", sql(f"select cantidad_disponible from inventario_sucursal where variante_id="
                                       f"'{ids_a['variante']}' and sucursal_id='{SUC_A}'") == "8")
check("el pago pendiente de A sigue PENDIENTE", sql(f"select estado from pagos where id='{ids_a['pago2']}'") == "PENDIENTE")

# ---------------------------------------------------------------- referencias cruzadas
s, b = req("POST", f"/ventas/carrito/{CB}/items", {"varianteId": ids_a["variante"], "cantidad": 1}, TCB, SB)
check("clienta B agrega al carrito la variante de A -> 404", s == 404, (s, b))
col_b = B("GET", "/catalogo/colecciones")[1][0]
cat_b = cats_b[0]
prod_b = must(*B("POST", "/catalogo/productos", {"categoriaId": cat_b["id"], "coleccionId": col_b["id"],
                                                 "titulo": "Vestido B", "slug": SLUG_COMUN, "precioCents": 9000}),
              201, "producto B")
check("mismo slug de producto en A y B -> 201 en las dos", prod_b["slug"] == SLUG_COMUN)
talla_b, color_b = B("GET", "/catalogo/tallas")[1][0], B("GET", "/catalogo/colores")[1][0]
s, var_b = B("POST", f"/catalogo/productos/{prod_b['id']}/variantes",
             {"tallaId": talla_b["id"], "colorId": color_b["id"], "sku": SKU_COMUN})
check("mismo SKU en A y B -> 201", s == 201, (s, var_b))
s, b = B("POST", "/promociones/cupones", {"codigo": COD_COMUN, "tipoDescuento": "PORCENTAJE", "valor": 5,
                                          "fechaInicio": iso(-60), "fechaFin": iso(60 * 24)})
check("mismo código de cupón en A y B -> 201", s == 201, (s, b))
s1, _ = A("POST", "/catalogo/tallas", {"nombre": f"Q{sufijo[:3]}", "orden": 9})
s2, _ = B("POST", "/catalogo/tallas", {"nombre": f"Q{sufijo[:3]}", "orden": 9})
check("mismo nombre de talla en A y B -> 201 en las dos", s1 == 201 and s2 == 201, (s1, s2))
s, b = B("POST", "/catalogo/productos", {"categoriaId": cat_b["id"], "coleccionId": ids_a["coleccion"],
                                         "titulo": "Robo", "slug": "robo-" + sufijo, "precioCents": 1})
check("B crea un producto en una colección de A -> 404", s == 404, (s, b))
must(*B("POST", "/inventario/ajustes", {"varianteId": var_b["id"], "sucursalId": SUC_B, "cantidad": 5,
                                        "motivo": "stock QA"}), 201, "ajuste B")
must(*req("POST", f"/ventas/carrito/{CB}/items", {"varianteId": var_b["id"], "cantidad": 1}, TCB, SB), 201, "carrito B")
s, b = req("POST", f"/ventas/carrito/{CB}/checkout", {"sucursalId": SUC_A, "canal": "WEB"}, TCB, SB)
check("checkout de la clienta B en una sucursal de A -> 404", s == 404, (s, b))
s, b = req("POST", "/reservas", {"sucursalId": SUC_A, "fechaHoraPrevista": iso(120),
                                 "items": [{"varianteId": ids_a["variante"], "cantidad": 1}]}, TCB, SB)
check("reserva de la clienta B con variante/sucursal de A -> 404", s == 404, (s, b))
s, b = req("POST", "/promociones/cupones/validar", {"codigo": COD_A, "subtotalCents": 20000}, tenant=SB)
check("validar en B el cupón de A -> inválido", s in (200, 201) and b["valido"] is False, (s, b))
s, b = req("POST", "/promociones/cupones/validar", {"codigo": COD_A, "subtotalCents": 20000}, tenant=SA)
check("... y en A el mismo código sí vale", b["valido"] is True, (s, b))

# ---------------------------------------------------------------- IA
s, b = B("POST", "/ia/reportes/consulta", {"metrica": "ingresos", "agruparPor": "ninguno"})
check("IA ingresos en B -> 0 (A tiene una venta pagada)", s == 200 and b["filas"][0]["valor"] == 0, (s, b))
s, b = A("POST", "/ia/reportes/consulta", {"metrica": "ingresos", "agruparPor": "ninguno"})
check("IA ingresos en A -> 15000", s == 200 and b["filas"][0]["valor"] == 15000, (s, b))
s, b = B("POST", "/ia/reportes/consulta", {"metrica": "cantidad_productos", "agruparPor": "ninguno"})
check("IA cantidad_productos en B -> 1 (solo el suyo)", s == 200 and b["filas"][0]["valor"] == 1, (s, b))

# ---------------------------------------------------------------- contrato de cabecera
s, _ = req("GET", "/ventas", tok=TA, tenant=SB)
check("token de A + X-Tenant de B -> 403", s == 403, s)
s, _ = req("GET", "/catalogo/productos")
check("sin token ni cabecera -> 400", s == 400, s)
s, _ = req("GET", "/catalogo/productos", tenant="no-existe-" + sufijo)
check("X-Tenant inexistente -> 404", s == 404, s)
s, plat = req("POST", "/seguridad/auth/login", {"email": PLAT_EMAIL, "password": PLAT_PASS})
check("login de la plataforma sin X-Tenant -> 200 y tenant null", s == 200 and plat["usuario"]["tenant"] is None
      and plat["usuario"]["role"] == "DUENO_PLATAFORMA", (s, plat))
TP = plat["accessToken"]
s, _ = req("GET", "/ventas", tok=TP)
check("token de DUENO_PLATAFORMA en GET /ventas -> 403", s == 403, s)
s2, _ = req("GET", "/seguridad/auth/me", tok=TP, tenant=SA)
check("cuenta de plataforma con X-Tenant -> 403", s2 == 403, s2)
s, _ = A("GET", "/saas/plataforma/inquilinos")
check("ADMIN de A en /saas/plataforma/inquilinos -> 403", s == 403, s)
s, b = req("POST", "/seguridad/auth/login", {"email": f"duena@{SA}.test", "password": "Qa123456!"}, tenant=SB)
check("la dueña de A no entra con X-Tenant de B -> 401", s == 401, s)
s, me = req("GET", "/seguridad/auth/me", tok=TA)
check("/me trae sucursalId y tenant", s == 200 and me["tenant"]["slug"] == SA and "sucursalId" in me, (s, me))

# ---------------------------------------------------------------- disponibilidad
s, b = req("PATCH", f"/saas/plataforma/inquilinos/{tb['tienda']['id']}/estado",
           {"estado": "SUSPENDIDO", "motivo": "falta de pago QA"}, TP)
check("plataforma suspende B -> 200", s == 200 and b["estado"] == "SUSPENDIDO" and not b["disponible"], (s, b))
s, b = req("GET", "/catalogo/productos", tenant=SB)
check("B suspendida: catálogo -> 403", s == 403, (s, b))
s, b = req("GET", "/saas/mi-suscripcion", tok=TB)
check("B suspendida: /saas/mi-suscripcion del ADMIN -> 200", s == 200, (s, b))
s, b = req("GET", f"/saas/tiendas/{SB}")
check("B suspendida: /saas/tiendas/:slug -> disponible false", s == 200 and b["disponible"] is False, (s, b))
s, _ = req("PATCH", f"/saas/plataforma/inquilinos/{tb['tienda']['id']}/estado", {"estado": "ACTIVO"}, TP)
s2, _ = req("GET", "/catalogo/productos", tenant=SB)
check("plataforma reactiva B -> catálogo 200", s == 200 and s2 == 200, (s, s2))

# ---------------------------------------------------------------- límites (B en Básico)
s, b = B("POST", "/sucursales", {"nombre": "Sucursal 2 B", "direccion": "Av. Blanco 1", "ciudadId": ciudades["Oruro"]})
check("B (Básico): 2a sucursal -> 409 con el mensaje del plan", s == 409 and "Básico" in b["message"], (s, b))
nuevos = []
for i in range(3):
    s, u = req("POST", "/seguridad/auth/register", {"email": f"staff{i}.{sufijo}@qa.test", "password": "Qa123456!",
                                                    "fullName": f"Staff {i}"}, tenant=SB)
    nuevos.append(u["usuario"]["id"])
r = [B("PATCH", f"/seguridad/usuarios/{uid}/rol", {"role": "CAJERO", "sucursalId": SUC_B})[0] for uid in nuevos]
check("B (Básico, 3 de staff): promover al 2o y 3o -> 200, al 4o -> 409", r == [200, 200, 409], r)
s, b = B("PATCH", "/saas/mi-suscripcion/plan", {"planCodigo": "crecimiento"})
check("B en TRIAL cambia a Crecimiento -> 200", s == 200 and b["plan"]["codigo"] == "crecimiento", (s, b))
s, b = B("POST", "/sucursales", {"nombre": "Sucursal 2 B", "direccion": "Av. Blanco 1", "ciudadId": ciudades["Oruro"]})
check("... y ahora la 2a sucursal (ciudad global) -> 201", s == 201, (s, b))
s, b = B("PATCH", "/saas/mi-suscripcion/plan", {"planCodigo": "basico"})
check("bajar a Básico con 2 sucursales -> 409", s == 409, (s, b))

# ---------------------------------------------------------------- transacción del alta
antes = sql("select (select count(*) from inquilinos)||'/'||(select count(*) from usuarios)")
s, b = registrar_tienda(SA, "basico", "Sucre")
despues = sql("select (select count(*) from inquilinos)||'/'||(select count(*) from usuarios)")
check("alta con el slug de A -> 409 y no deja filas", s == 409 and antes == despues, (s, b, antes, despues))

# ---------------------------------------------------------------- barrida global
stock_antes = int(sql(f"select cantidad_disponible from inventario_sucursal where variante_id='{ids_a['variante']}' "
                      f"and sucursal_id='{SUC_A}'"))
sql(f"update ventas set \"createdAt\"='{local_ts(-60 * 30)}' where id='{venta2['id']}'")
sql(f"update pagos set \"createdAt\"='{local_ts(-60 * 30)}' where venta_id='{venta2['id']}'")
s, b = B("POST", "/pagos/expirar-vencidas")
estado = sql(f"select estado from ventas where id='{venta2['id']}'")
stock_despues = int(sql(f"select cantidad_disponible from inventario_sucursal where variante_id='{ids_a['variante']}' "
                        f"and sucursal_id='{SUC_A}'"))
check("ADMIN de B dispara la barrida: la venta vencida de A queda CANCELADA", s == 200 and estado == "CANCELADA",
      (s, b, estado))
check("... y el stock de A vuelve (+1)", stock_despues == stock_antes + 1, (stock_antes, stock_despues))

print(f"\n{ok} ok, {fail} fallos  (tiendas {SA} / {SB})")
