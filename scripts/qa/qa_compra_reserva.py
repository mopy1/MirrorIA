# QA de "compra desde la reserva" + confirmación de la cajera (reemplaza a qa_mostrador.py, 2026-11-07: sin POS).
# Alcance por sucursal del staff, En tienda / No compró, y la compra de la clienta que se cobra en caja.
exec(open(__file__.replace("qa_compra_reserva.py","qa_reglas.py")).read().split("ok=0; fail=0")[0])
ok=0; fail=0
def check(name, cond, extra=""):
    global ok, fail
    print(("PASS " if cond else "FAIL ")+name+("" if cond else f"  -> {extra}")); ok+=bool(cond); fail+=(not cond)
def reqk(m, path, body, tok, clave):
    # Igual que req() pero con Idempotency-Key; devuelve también la cabecera de caché.
    r=urllib.request.Request(API+path, method=m, data=json.dumps(body).encode(),
        headers={"Content-Type":"application/json","X-Tenant":TENANT,"Authorization":"Bearer "+tok,"Idempotency-Key":clave})
    try:
        with urllib.request.urlopen(r) as resp: return resp.status, json.loads(resp.read() or "null"), resp.headers.get("X-Cache-Idempotency")
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or "null"), None
sucs=sql(f"select id from sucursales where tenant_id='{TID}' order by nombre").splitlines(); A,B=sucs[0],sucs[1]
sql(f"update inventario_sucursal set cantidad_disponible=cantidad_disponible+20 where tenant_id='{TID}'")
def var_en(suc, excl=()):
    q=f"select variante_id from inventario_sucursal where sucursal_id='{suc}' and cantidad_disponible-cantidad_reservada>=6 order by cantidad_disponible desc"
    return [v for v in sql(q).splitlines() if v not in excl]
def stock(v, suc):
    d,r=sql(f"select cantidad_disponible||' '||cantidad_reservada from inventario_sucursal where variante_id='{v}' and sucursal_id='{suc}'").split()
    return int(d), int(r)
va=var_en(A); vb=var_en(B)
def staff(role, suc):
    t,i=user(); sql(f"update usuarios set role='{role}', sucursal_id={('null' if suc is None else repr(suc))} where id='{i}'")
    return req("POST","/seguridad/auth/login",{"email":sql(f"select email from usuarios where id='{i}'"),"password":"Qa123456!"})[1]["accessToken"]
cajA=staff("CAJERO",A); cajB=staff("CAJERO",B); encA=staff("ENCARGADO_SUCURSAL",A); admin=staff("ADMIN",None)
sinSuc_t,sinSuc_i=user(); sql(f"update usuarios set role='CAJERO' where id='{sinSuc_i}'")
sinSuc=req("POST","/seguridad/auth/login",{"email":sql(f"select email from usuarios where id='{sinSuc_i}'"),"password":"Qa123456!"})[1]["accessToken"]
def reserva(v, suc=None):
    c,_=user(); s,r=req("POST","/reservas",{"sucursalId":suc or A,"fechaHoraPrevista":iso(90),"items":[{"varianteId":v,"cantidad":1}]},c)
    assert s==201,(s,r); return c, r

# 1. Alcance del staff por sucursal (igual que antes)
c1,rA=reserva(va[0]); c2,rB=reserva(vb[0], B)
s,lst=req("GET",f"/reservas?sucursalId={B}",None,cajA)
check("cajera de A pidiendo B solo recibe A", s==200 and all(r["sucursalId"]==A for r in lst), s)
s,_=req("GET",f"/reservas/{rB['id']}",None,cajA); check("cajera de A no ve reserva de B -> 403", s==403, s)
s,_=req("PATCH",f"/reservas/{rB['id']}/estado",{"estado":"CONFIRMADA"},cajA); check("cajera de A no cambia reserva de B -> 403", s==403, s)
s,_=req("GET","/reservas",None,sinSuc); check("cajera sin sucursal -> 403", s==403, s)
s,lst=req("GET","/reservas",None,admin); check("admin ve ambas sucursales", s==200 and {A,B} <= {r["sucursalId"] for r in lst}, s)

# 2. No compró
s,b=req("PATCH",f"/reservas/{rA['id']}/estado",{"estado":"EN_TIENDA"},cajA); check("PENDIENTE -> EN_TIENDA directo", s==200 and b["estado"]=="EN_TIENDA", (s,b))
r0=stock(va[0],A)[1]
s,b=req("PATCH",f"/reservas/{rA['id']}/estado",{"estado":"CANCELADA"},cajA); check("EN_TIENDA -> CANCELADA (No compró)", s==200 and b["estado"]=="CANCELADA", (s,b))
check("No compró libera lo reservado", stock(va[0],A)[1]==r0-1, (r0, stock(va[0],A)))

# 3. Sin POS: la ruta vieja ya no existe
def status_de(m, path, body, tok):
    # Solo el código: el 404 de una ruta inexistente no trae JSON.
    r=urllib.request.Request(API+path, method=m, data=json.dumps(body).encode(),
        headers={"Content-Type":"application/json","X-Tenant":TENANT,"Authorization":"Bearer "+tok})
    try:
        with urllib.request.urlopen(r) as resp: return resp.status
    except urllib.error.HTTPError as e: return e.code
s=status_de("POST","/ventas/presenciales",{"sucursalId":A,"items":[{"varianteId":va[1],"cantidad":1}]},cajA)
check("POST /ventas/presenciales ya no existe -> 404", s==404, s)

# 4. Compra desde la reserva + efectivo confirmado por la cajera
c4,r4=reserva(va[2])
s,b=req("POST",f"/ventas/desde-reserva/{r4['id']}",{"canal":"MOVIL"},c4); check("comprar reserva PENDIENTE (no EN_TIENDA) -> 409", s==409, (s,b))
req("PATCH",f"/reservas/{r4['id']}/estado",{"estado":"EN_TIENDA"},cajA)
otra,_=user(); s,_=req("POST",f"/ventas/desde-reserva/{r4['id']}",{"canal":"WEB"},otra); check("otra clienta no compra mi reserva -> 403", s==403, s)
antes=stock(va[2],A); clave=str(uuid.uuid4())
s,v4,_=reqk("POST",f"/ventas/desde-reserva/{r4['id']}",{"canal":"MOVIL"},c4,clave)
check("compra desde la reserva -> 201 PENDIENTE ligada a la reserva", s==201 and v4["estado"]=="PENDIENTE" and v4["reservaId"]==r4["id"], (s,v4))
check("... sin tocar el stock (sigue apartado por la reserva)", stock(va[2],A)==antes, (antes, stock(va[2],A)))
s,b,cache=reqk("POST",f"/ventas/desde-reserva/{r4['id']}",{"canal":"MOVIL"},c4,clave)
check("reenvío con la misma Idempotency-Key -> misma venta (HIT)", s==201 and b["id"]==v4["id"] and cache=="HIT", (s,cache))
s,b=req("POST",f"/ventas/desde-reserva/{r4['id']}",{"canal":"MOVIL"},c4); check("segunda compra de la misma reserva -> 409", s==409, (s,b))
s,b=req("PATCH",f"/reservas/{r4['id']}/estado",{"estado":"CANCELADA"},cajA); check("No compró con compra esperando el cobro -> 409", s==409, (s,b))
s,cobro=req("POST",f"/pagos/ventas/{v4['id']}/manual",{"metodo":"EFECTIVO"},c4); check("la clienta elige efectivo en caja", s in (200,201) and cobro.get("pagoId"), (s,cobro))
s,_=req("POST",f"/pagos/{cobro['pagoId']}/confirmar",None,encA); check("encargada no confirma cobros -> 403", s==403, s)
s,_=req("POST",f"/pagos/{cobro['pagoId']}/confirmar",None,cajB); check("cajera de otra sucursal no confirma -> 403", s==403, s)
s,b=req("POST",f"/pagos/{cobro['pagoId']}/confirmar",None,cajA); check("cajera de A confirma el efectivo -> 200 APROBADO", s==200 and b["estado"]=="APROBADO", (s,b))
s,v=req("GET",f"/ventas/{v4['id']}",None,c4); check("venta PAGADA con comprobante", v["estado"]=="PAGADA" and v["numeroComprobante"], v)
check("reserva COMPLETADA", sql(f"select estado from reservas where id='{r4['id']}'")=="COMPLETADA")
check("stock: -1 disponible y -1 reservada (un solo descuento)", stock(va[2],A)==(antes[0]-1, antes[1]-1), (antes, stock(va[2],A)))

# 5. Compra cancelada: la reserva no queda colgada
c6,r6=reserva(va[3]); req("PATCH",f"/reservas/{r6['id']}/estado",{"estado":"EN_TIENDA"},cajA)
antes=stock(va[3],A)
s,v6=req("POST",f"/ventas/desde-reserva/{r6['id']}",{"canal":"WEB"},c6)
s,_=req("POST",f"/pagos/ventas/{v6['id']}/cancelar",None,c6); check("la clienta cancela la compra -> 204", s==204, s)
check("... la reserva sigue EN_TIENDA y el stock apartado igual", sql(f"select estado from reservas where id='{r6['id']}'")=="EN_TIENDA" and stock(va[3],A)==antes, (antes, stock(va[3],A)))
s,b=req("PATCH",f"/reservas/{r6['id']}/estado",{"estado":"CANCELADA"},cajA); check("... y ahora sí se cierra con No compró", s==200, (s,b))
print(f"\n{ok} ok, {fail} fallos")
