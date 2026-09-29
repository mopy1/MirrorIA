import json, subprocess, time, urllib.request, uuid, datetime as dt, math
API="http://localhost:3000/api/v1"
def req(m, path, body=None, tok=None):
    r=urllib.request.Request(API+path, method=m, data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type":"application/json", **({"Authorization":"Bearer "+tok} if tok else {})})
    try:
        with urllib.request.urlopen(r) as resp: return resp.status, json.loads(resp.read() or "null")
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or "null")
def sql(q): return subprocess.run(["docker","exec","mirroria_postgres","psql","-U","mirroria","-d","mirroria_db","-tAc",q],capture_output=True,text=True).stdout.strip()
def user():
    e=f"qa.{uuid.uuid4().hex[:8]}@local.test"
    s,b=req("POST","/seguridad/auth/register",{"email":e,"password":"Qa123456!","fullName":"QA Local"})
    assert s==201,(s,b); return b["accessToken"], b["usuario"]["id"]
def local_ts(minutes):
    return (dt.datetime.now()+dt.timedelta(minutes=minutes)).strftime('%Y-%m-%d %H:%M:%S')
def iso(minutes): return (dt.datetime.now(dt.timezone.utc)+dt.timedelta(minutes=minutes)).isoformat()
ok=0; fail=0
def check(name, cond, extra=""):
    global ok, fail
    print(("PASS " if cond else "FAIL ")+name+("" if cond else f"  -> {extra}")); ok+=cond; fail+= (not cond)

# variantes con stock en una sucursal
suc0=sql("select sucursal_id from inventario_sucursal where cantidad_disponible>=4 and cantidad_reservada=0 group by sucursal_id order by count(*) desc limit 1")
rows=[r.split("|") for r in sql(f"select variante_id, sucursal_id, cantidad_disponible, cantidad_reservada from inventario_sucursal where sucursal_id='{suc0}' and cantidad_disponible>=4 and cantidad_reservada=0 order by cantidad_disponible desc limit 6").splitlines()]
print("variantes en la sucursal:", len(rows))
(v1,suc,disp1,_),(v2,_,_,_),(v3,_,_,_),(v4,_,_,_)=rows[0],rows[1],rows[2],rows[3]
same=[r for r in rows if r[1]==suc]
tok,uid=user()

s,b=req("POST","/reservas",{"sucursalId":suc,"fechaHoraPrevista":iso(120),"items":[{"varianteId":v1,"cantidad":2}]},tok)
check("2 unidades de la misma variante -> 400", s==400, (s,b))
s,b=req("POST","/reservas",{"sucursalId":suc,"fechaHoraPrevista":iso(120),"items":[{"varianteId":x,"cantidad":1} for x in (v1,v2,v3,v4)]},tok)
check("4 prendas en una reserva -> 400", s==400, (s,b))
s,b=req("POST","/reservas",{"sucursalId":suc,"fechaHoraPrevista":iso(10),"items":[{"varianteId":v1,"cantidad":1}]},tok)
check("reserva para dentro de 10 min -> 409", s==409, (s,b))
s,b=req("POST","/reservas",{"sucursalId":suc,"fechaHoraPrevista":iso(60*72),"items":[{"varianteId":v1,"cantidad":1}]},tok)
check("reserva para dentro de 3 dias -> 409", s==409, (s,b))
s,b=req("POST","/reservas",{"sucursalId":suc,"fechaHoraPrevista":iso(120),"items":[{"varianteId":v1,"cantidad":1},{"varianteId":v1,"cantidad":1}]},tok)
check("variante repetida -> 409", s==409, (s,b))

s,r1=req("POST","/reservas",{"sucursalId":suc,"fechaHoraPrevista":iso(120),"items":[{"varianteId":v1,"cantidad":1}]},tok)
check("reserva valida 1 -> 201", s==201, (s,r1))
s,r2=req("POST","/reservas",{"sucursalId":suc,"fechaHoraPrevista":iso(180),"items":[{"varianteId":v2,"cantidad":1}]},tok)
check("reserva valida 2 -> 201", s==201, (s,r2))
s,b=req("POST","/reservas",{"sucursalId":suc,"fechaHoraPrevista":iso(200),"items":[{"varianteId":v3,"cantidad":1}]},tok)
check("tercera reserva activa -> 403", s==403, (s,b)); print("   mensaje:", b.get("message"))
s,c=req("GET","/reservas/mias/cupo",None,tok)
check("cupo: 2 activas, no puede reservar", s==200 and c["reservasActivas"]==2 and not c["puedeReservar"], c)

# vencimiento automatico: una pendiente en el pasado -> EXPIRADA y libera stock
reserv_antes=int(sql(f"select cantidad_reservada from inventario_sucursal where variante_id='{v1}' and sucursal_id='{suc}'"))
sql(f"update reservas set fecha_hora_prevista='{local_ts(-120)}' where id='{r1['id']}'")
s,mias=req("GET","/reservas/mias",None,tok)
e1=[x for x in mias if x["id"]==r1["id"]][0]["estado"]
reserv_despues=int(sql(f"select cantidad_reservada from inventario_sucursal where variante_id='{v1}' and sucursal_id='{suc}'"))
check("pendiente vencida -> EXPIRADA", e1=="EXPIRADA", e1)
check("vencimiento libera el stock reservado", reserv_despues==reserv_antes-1, (reserv_antes,reserv_despues))

# confirmada vencida -> NO_SHOW (con un admin local)
atok,aid=user(); sql(f"update usuarios set role='ADMIN' where id='{aid}'")
s,_=req("PATCH",f"/reservas/{r2['id']}/estado",{"estado":"CONFIRMADA"},atok)
check("staff confirma reserva -> 200", s==200, s)
sql(f"update reservas set fecha_hora_prevista='{local_ts(-180)}' where id='{r2['id']}'")
s,c=req("GET","/reservas/mias/cupo",None,tok)
e2=sql(f"select estado from reservas where id='{r2['id']}'")
check("confirmada vencida -> NO_SHOW", e2=="NO_SHOW", e2)
check("2 faltas -> bloqueada", c["faltasRecientes"]==2 and c["bloqueadaHasta"] and not c["puedeReservar"], c)
print("   motivo:", c["motivo"])
s,b=req("POST","/reservas",{"sucursalId":suc,"fechaHoraPrevista":iso(120),"items":[{"varianteId":v3,"cantidad":1}]},tok)
check("bloqueada no puede reservar -> 403", s==403, (s,b))

# tope de stock reservable: variante con D disponibles admite ceil(D/2) reservadas
vd,sd,D,R0=sql(f"select variante_id,sucursal_id,cantidad_disponible,cantidad_reservada from inventario_sucursal where cantidad_disponible between 2 and 12 and cantidad_reservada=0 and variante_id not in ('{v1}','{v2}','{v3}','{v4}') order by cantidad_disponible limit 1").split("|")
D=int(D); tope=math.ceil(D*0.5); oks=0; last=None
for i in range(tope+1):
    t,_=user(); s,b=req("POST","/reservas",{"sucursalId":sd,"fechaHoraPrevista":iso(120),"items":[{"varianteId":vd,"cantidad":1}]},t)
    if s==201: oks+=1
    else: last=(s,b)
check(f"tope reservable: stock {D} -> {tope} reservas y la siguiente rechazada", oks==tope and last and last[0]==409, (oks,last))
if last: print("   mensaje:", last[1].get("message"))

# compras: tope por variante y compras pendientes
ctok,cid=user()
s,b=req("POST",f"/ventas/carrito/{cid}/items",{"varianteId":v4,"cantidad":4},ctok)
check("carrito: 4 unidades de una variante -> 409", s==409, (s,b))
s,b=req("POST",f"/ventas/carrito/{cid}/items",{"varianteId":v4,"cantidad":3},ctok)
check("carrito: 3 unidades -> 201", s==201, (s,b))
s,b=req("POST",f"/ventas/carrito/{cid}/items",{"varianteId":v4,"cantidad":1},ctok)
check("carrito: sumar la 4ta -> 409", s==409, (s,b))
pend=[]
for i in range(3):
    if i>0: req("POST",f"/ventas/carrito/{cid}/items",{"varianteId":v4,"cantidad":1},ctok)
    s,b=req("POST",f"/ventas/carrito/{cid}/checkout",{"sucursalId":suc,"canal":"WEB"},ctok); pend.append((s,b))
check("checkout 1 y 2 -> 201", pend[0][0]==201 and pend[1][0]==201, pend[:2])
check("checkout 3 con 2 pendientes -> 409", pend[2][0]==409, pend[2]); print("   mensaje:", pend[2][1].get("message"))

# limpieza: devolver stock de las ventas de prueba
for s,b in pend[:2]:
    if s==201: sql(f"update ventas set created_at=created_at where id='{b['id']}'")
print(f"\n{ok} ok, {fail} fallos")
