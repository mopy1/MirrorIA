exec(open(__file__.replace("qa_mostrador.py","qa_reglas.py")).read().split("ok=0; fail=0")[0])
ok=0; fail=0
def check(name, cond, extra=""):
    global ok, fail
    print(("PASS " if cond else "FAIL ")+name+("" if cond else f"  -> {extra}")); ok+=cond; fail+=(not cond)
sucs=sql("select id from sucursales order by nombre").splitlines(); A,B=sucs[0],sucs[1]
sql("update inventario_sucursal set cantidad_disponible=cantidad_disponible+20")
def var_en(suc, excl=()):
    q=f"select variante_id from inventario_sucursal where sucursal_id='{suc}' and cantidad_disponible-cantidad_reservada>=6 order by cantidad_disponible desc"
    return [v for v in sql(q).splitlines() if v not in excl]
va=var_en(A); vb=var_en(B)
def staff(role, suc):
    t,i=user(); sql(f"update usuarios set role='{role}', sucursal_id={('null' if suc is None else repr(suc))} where id='{i}'")
    return req("POST","/seguridad/auth/login",{"email":sql(f"select email from usuarios where id='{i}'"),"password":"Qa123456!"})[1]["accessToken"]
cajA=staff("CAJERO",A); admin=staff("ADMIN",None); sinSuc_t,sinSuc_i=user(); sql(f"update usuarios set role='CAJERO' where id='{sinSuc_i}'")
sinSuc=req("POST","/seguridad/auth/login",{"email":sql(f"select email from usuarios where id='{sinSuc_i}'"),"password":"Qa123456!"})[1]["accessToken"]

c1,_=user(); s,rA=req("POST","/reservas",{"sucursalId":A,"fechaHoraPrevista":iso(90),"items":[{"varianteId":va[0],"cantidad":1}]},c1)
c2,_=user(); s2,rB=req("POST","/reservas",{"sucursalId":B,"fechaHoraPrevista":iso(90),"items":[{"varianteId":vb[0],"cantidad":1}]},c2)
check("reservas de prueba creadas", s==201 and s2==201, (s,rA,s2,rB))

s,lst=req("GET",f"/reservas?sucursalId={B}",None,cajA)
check("cajero de A pidiendo B solo recibe A", s==200 and all(r["sucursalId"]==A for r in lst), (s, {r['sucursalId'] for r in lst} if s==200 else lst))
s,_=req("GET",f"/reservas/{rB['id']}",None,cajA); check("cajero de A no ve reserva de B -> 403", s==403, s)
s,_=req("PATCH",f"/reservas/{rB['id']}/estado",{"estado":"CONFIRMADA"},cajA); check("cajero de A no cambia reserva de B -> 403", s==403, s)
s,_=req("GET","/reservas",None,sinSuc); check("cajero sin sucursal -> 403", s==403, s)
s,lst=req("GET","/reservas",None,admin); check("admin ve ambas sucursales", s==200 and {A,B} <= {r["sucursalId"] for r in lst}, s)

s,b=req("PATCH",f"/reservas/{rA['id']}/estado",{"estado":"EN_TIENDA"},cajA); check("PENDIENTE -> EN_TIENDA directo (cajero de A)", s==200 and b["estado"]=="EN_TIENDA", (s,b))
res0=int(sql(f"select cantidad_reservada from inventario_sucursal where variante_id='{va[0]}' and sucursal_id='{A}'"))
s,b=req("PATCH",f"/reservas/{rA['id']}/estado",{"estado":"CANCELADA"},cajA); check("EN_TIENDA -> CANCELADA (se probo y no compro)", s==200 and b["estado"]=="CANCELADA", (s,b))
res1=int(sql(f"select cantidad_reservada from inventario_sucursal where variante_id='{va[0]}' and sucursal_id='{A}'"))
check("no compro: libera el stock reservado", res1==res0-1, (res0,res1))

# cierre automatico de EN_TIENDA olvidada
c3,_=user(); s,r3=req("POST","/reservas",{"sucursalId":A,"fechaHoraPrevista":iso(90),"items":[{"varianteId":va[1],"cantidad":1}]},c3)
req("PATCH",f"/reservas/{r3['id']}/estado",{"estado":"EN_TIENDA"},cajA)
sql(f"update reservas set fecha_hora_prevista='{local_ts(-300)}' where id='{r3['id']}'")
s,cupo=req("GET","/reservas/mias/cupo",None,c3)
check("EN_TIENDA olvidada 5h -> CANCELADA sola", sql(f"select estado from reservas where id='{r3['id']}'")=="CANCELADA")
check("... y no cuenta como falta", cupo["faltasRecientes"]==0, cupo)

# cobrar en otra sucursal
c4,_=user(); s,r4=req("POST","/reservas",{"sucursalId":A,"fechaHoraPrevista":iso(90),"items":[{"varianteId":va[2],"cantidad":1}]},c4)
req("PATCH",f"/reservas/{r4['id']}/estado",{"estado":"EN_TIENDA"},admin)
s,b=req("POST","/ventas/presenciales",{"sucursalId":B,"reservaId":r4["id"],"items":[{"varianteId":vb[1],"cantidad":1}]},admin)
check("admin cobra reserva de A en B -> 409", s==409, (s,b)); print("   mensaje:", b.get("message"))
s,b=req("POST","/ventas/presenciales",{"sucursalId":B,"items":[{"varianteId":vb[1],"cantidad":1}]},cajA)
check("cajero de A registra venta en B -> 403", s==403, (s,b))
s,b=req("POST","/ventas/presenciales",{"sucursalId":A,"reservaId":r4["id"],"items":[{"varianteId":va[2],"cantidad":1}]},cajA)
check("cajero de A cobra la reserva en A -> 201 y la completa", s==201 and sql(f"select estado from reservas where id='{r4['id']}'")=="COMPLETADA", (s,b))
print(f"\n{ok} ok, {fail} fallos")
