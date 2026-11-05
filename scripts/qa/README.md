# QA de reglas de negocio contra la API real (2026-09-29)

Scripts que prueban de punta a punta las reglas de reservas, compras y mostrador
contra un backend **local** con su Postgres local (nunca contra Azure: crean
usuarias, reservas y ventas, y editan fechas/stock por SQL para simular el paso
del tiempo).

```bash
docker start mirroria_postgres
cd mirroria-backend && npm run build && node dist/main.js &   # API en :3000
python3 scripts/qa/qa_reglas.py      # 21 escenarios: topes, ventana, vencimiento, faltas, tope de stock, compras
python3 scripts/qa/qa_mostrador.py   # 14 escenarios: alcance por sucursal, En tienda, No compró, cobro en otra sucursal
python3 scripts/qa/qa_aislamiento.py # 84 chequeos multi-tenant (Fase 1): dos tiendas nuevas, nada de A visible desde B
```

- **Fase 1 SaaS (2026-11-04):** todos mandan `X-Tenant` (`TENANT`, default `mirroria`) y aceptan
  `API=http://localhost:3100/api/v1` para apuntar a otro puerto. El SQL directo se acota a la tienda
  `mirroria` (`tenant_id`). `qa_aislamiento.py` registra tiendas `qa-a-*`/`qa-b-*` (máx. 5 altas por
  hora por IP: reiniciar el backend para resetear) y necesita `PLATAFORMA_EMAIL`/`PLATAFORMA_PASSWORD`.
  Conviene `pg_dump` antes y `pg_restore --clean` después.

- Usan `docker exec mirroria_postgres psql` para preparar datos y leer resultados.
- `qa_mostrador.py` suma 20 unidades a todo el inventario local de `mirroria` para tener stock libre.
- Las fechas son `timestamp without time zone` y el backend escribe con la zona del
  proceso: por eso los `UPDATE` de fechas usan hora local (`local_ts`), no `now()`.
