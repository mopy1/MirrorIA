# HANDOFF — punto de entrada para una IA nueva

> Actualizado: 2026-11-06, Fase 6b (rama `main`). Si el código cambió después, el código manda:
> verificá con los comandos de la sección 4 y corregí este archivo.

## 1. Qué es esto (en 6 líneas)

> **2026-11-05: se intercambiaron los nombres** — la plataforma SaaS se llama **MirrorIA** (como el repo) y la tienda
> principal se llama **Tiendaria** (slug `tiendaria`); en specs/commits anteriores al cambio, 'Tiendaria' significa la plataforma.

- **MirrorIA** es una plataforma **SaaS multi-tenant** (*Software as a Service* con varios inquilinos)
  de tiendas online de moda femenina: cualquier boutique elige un plan, se da de alta y recibe su
  tienda en `/t/<slug>`, con su marca, sucursales, catálogo, reservas, pagos, reportes por IA y probador virtual.
- **Tiendaria** es **una tienda más** dentro de MirrorIA (slug `tiendaria`, marca vino/rosa, datos del Parcial 1).
  El repo, los contenedores, las variables de entorno, la BD y los correos (`*@mirroria.com`) dicen `mirroria`. No se renombran.
- Es el **Segundo Parcial de Sistemas de Información II (SI2)**, semestre 2-2026. **Entrega: 2026-11-11 08:00**:
  un **PDF** con metodología **ICONIX** (modelo de dominio → casos de uso (CU) → diagramas de robustez →
  secuencia → clases → código) y **UML 2.5**, más la app funcionando como evidencia.
- Enunciado: vault `U/2-2026/SI2/Parcial2/Enunciado.md`. Plan y estado por fase: vault `U/2-2026/SI2/Parcial2/Plan_Parcial2.md`.
- Vault de Obsidian: `/mnt/c/Users/lmc/Documents/Obsidian` (rutas `U/...` de este archivo son relativas a él).

## 2. Estado exacto

| Fase | Estado |
|---|---|
| 0 — Arquitectura e ICONIX base | integrada a las Fases 1 y 1b (capítulos `Parcial2/Documentacion/01_*` y `02_*`) |
| 1 — SaaS multi-tenant | ✅ cerrada, commit `d6d05f6` |
| 1b — Identidad de la plataforma (entonces "Tiendaria"): marca por tienda + panel de plataforma | ✅ cerrada, commit `f91938c` |
| 2 — Pasarelas enchufables | ✅ cerrada, commit `b4eaa0a` (registro centralizado, adaptadores Stripe y Wayra funcionales, stubs 503 para PayPal y QR Bancario, nueva tabla `cobros_suscripcion`). |
| 3 — Offline/PWA, idempotencia y conflictos | ✅ cerrada, commit `48b1e54` (PWA + Service Worker con cache App Shell, IndexedDB con TTL 7d y outbox FIFO, tabla `idempotencia` en backend con hashing SHA-256 canónico, interceptor HIT/MISS/422/409, resolución de conflicto `stock = 1` con error 409 tipado y transacción compensatoria). |
| 4 — Reportes dinámicos (+ Excel) | ✅ cerrada, commit `bafea4c` (`TablaDinamicaReporte` con ordenación interactiva, filtrado y repivoteo en vivo; `ConstructorReporteDialog` estructurado sin coste de LLM; exportación nativa a `.xlsx` con `exceljs` con formato contable `"Bs" #,##0.00`, fórmulas de totales y auto-ajuste; nuevas dimensiones `metodo_pago`, `proveedor_pago` y `proveedor`). |
| 5 — BI: dashboards por rol | ✅ cerrada, commit `b8a6263` (`BiModule`, `GET /dashboard/ejecutivo` y `GET /dashboard/operativo`; experiencia diferenciada en `/admin/dashboard`: consola ejecutiva para `ADMIN` con KPIs, deltas simétricos, rotación, conversión, Recharts de tendencia, pasarelas, top prendas y top proveedores; y consola operativa POS para `CAJERO`/`ENCARGADO` con agenda cronológica de reservas, atención en 1 clic y alertas de stock crítico $\le 2$). |
| 6 — Machine Learning por KPIs | ✅ cerrada (`mirroria-ml/` con FastAPI :8002 y scikit-learn; dataset sintético `seed=42`, $N=10.000$; 4 modelos: M1 Demanda Random Forest, M2 No-Show Regresión Logística, M3 RFM KMeans, M4 Anomalías Isolation Forest; `MlModule` en NestJS con fallback resiliente `X-ML-Fallback: true`; vistas en `/admin/ml` y reservas POS; 6 pytest + 466 tests back + 190 front). |
| 6b — Rediseño UX/UI del admin (gerente sin tecnicismos) | ✅ cerrada (solo frontend): menú lateral en acordeón, Dashboard BI (Resumen del negocio / Hoy en la tienda), Predicciones en lenguaje de negocio (técnico tras "¿Cómo se calcula?") y Reportes con IA (markdown renderizado, lienzo de informe, chat con conclusión corta). Spec `Parcial2/Fase6b_Spec_Rediseno_UX_Admin.md`. |
| **7 — Documento ICONIX + UML 2.5 → PDF** | ⏭️ **la siguiente**. Capítulos 01 a 07; modelo de dominio, casos de uso, robustez, secuencia, clases y componentes para la entrega final. |

Números verificados: **113 rutas** HTTP, **30 tablas**, **466** tests unitarios backend (56 archivos),
**293** tests frontend (52 archivos), 6 tests pytest en ML, e2e backend 62/62.

## 3. Orden de lectura

1. Este archivo.
2. `AGENTS.md` (raíz): árbol del monorepo, puertos, comandos, mapa front ↔ back.
3. El `AGENTS.md` del paquete que vas a tocar: `mirroria-backend/AGENTS.md` (módulos y tabla de las 101 rutas)
   o `mirroria-frontend/AGENTS.md` (rutas, guards, features). Móvil: `mirroria-mobile/AGENTS.md` (Expo SDK 58, rehecha desde cero 2026-11-07; **M0–M4.5 hechos** en la rama `feat/app-movil`: offline con SQLite + outbox, pagos, reservas, escáner, avisos, probador Decart; ya no corre en Expo Go, se usa el *development build* o el APK de `mirroria-mobile/dist/`).
4. En el vault: `U/2-2026/SI2/Parcial2/Plan_Parcial2.md` y la spec de la fase en curso
   (`Fase1_Spec_MultiTenant.md`, `Fase1b_Spec_Personalizacion_Tiendaria.md` son el modelo a seguir).
5. Contratos y datos: vault `U/2-2026/SI2/Parcial1/App/` (`Endpoints.md`, `Database.md`, `Reglas_de_Negocio.md`,
   `Troubleshooting.md`, `Despliegue_Azure.md`). Pese a la carpeta "Parcial1", son las notas vivas de la app actual.

## 4. Levantar y verificar

```bash
cd /home/lmc/projects/MirrorIA
docker compose up -d --build --force-recreate   # mirroria_postgres :5435 · mirroria_backend :3000 · mirroria_frontend :80
# o en dev: docker compose up -d postgres-db ; (cd mirroria-backend && npm run start:dev) ; (cd mirroria-frontend && npm run dev)  → web :5174
docker logs mirroria_backend 2>&1 | grep -oE 'Mapped \{[^}]+\}' | sort -u | wc -l     # 106
curl -H 'X-Tenant: tiendaria' localhost:3000/api/v1/catalogo/productos                  # toda ruta de negocio necesita la tienda
```

- API: prefijo `/api/v1`, Swagger en `/api/docs` (solo fuera de producción). Toda ruta de negocio necesita
  la cabecera **`X-Tenant: <slug>`** (sin sesión) o un JWT de esa tienda; sin ninguna → 400.
- Web: `/` landing de MirrorIA · `/t/tiendaria` (y `/t/casa-andina`, `/t/nomada`) tiendas · `/admin` panel de la
  tienda del usuario logueado · `/plataforma` panel del dueño de la plataforma.
- **Cuentas de prueba (solo BD local; la clave común de desarrollo NO se versiona, está en el vault):** lista completa y clave en vault
  `U/2-2026/SI2/Parcial1/App/Database.md` → "Estado de la BD local". Atajos: `admin@mirroria.com` (ADMIN de Tiendaria),
  `rosa@casa-andina.bo`, `camila@nomada.bo` (ADMIN de las tiendas demo). La cuenta de plataforma
  `plataforma@mirroria.com` (rol `DUENO_PLATAFORMA`) usa `PLATAFORMA_PASSWORD` de `mirroria-backend/.env`.
- `NODE_ENV=development` en el `.env` local **a propósito** (activa `synchronize` de TypeORM y Swagger). Azure usa `production`.

**Tests y QA:**

```bash
cd mirroria-backend && npx vitest run          # 483 unit (60 archivos)
cd mirroria-backend && npm run test:e2e        # 62 e2e, necesita Postgres (escribe en la BD local)
cd mirroria-frontend && npx vitest run         # 293 (52 archivos)
cd mirroria-frontend && npx tsc -b --noEmit && npm run lint
python3 scripts/qa/qa_reglas.py      # 21  · qa_compra_reserva.py 26 · qa_aislamiento.py 84 · qa_marca.py 37
```

Los e2e y los scripts de `scripts/qa/` **ensucian la BD local** (crean tiendas, usuarias, ventas, stock).
Antes: `docker exec mirroria_postgres pg_dump -U mirroria -Fc mirroria_db > /ruta/respaldo.dump`; después:
`docker exec -i mirroria_postgres pg_restore -U mirroria -d mirroria_db --clean --if-exists < /ruta/respaldo.dump`.
Avisale al usuario que no use la app mientras se restaura. Detalle en `scripts/qa/README.md`.

## 5. Reglas NO negociables del usuario

- **Responder siempre en español.**
- **Protocolo de agentes** (vault `Personal/Arquitecturas/Protocolo_Desarrollo_Agentes.md`): para una fase o feature
  completa, nunca trabajar solo: Arquitecto/Spec Lead (spec DB-first en el vault) → Backend Builder →
  Frontend Builder → Auditor QA y visual (capturas). Cada Builder anota sus "Desviaciones" en la spec.
- Frontend: componentes **< 120 líneas**, **shadcn/ui** (Base UI) + iconos **Phosphor** (nunca lucide),
  **cero páginas huérfanas** (toda ruta tiene un link), páginas finas, lógica en hooks/`lib/`.
- Backend: **`soloTenant()` en toda consulta** de una entidad con tenant (o `tenant_id = :tenantId` en SQL crudo);
  `core/` nunca importa de `modules/`; un módulo no importa entidades de otro; errores con shape `{ status, message, timestamp }`.
- Docker: nunca `restart: always` / `unless-stopped`; contenedores `mirroria_<parte>`; cuidar la RAM (WSL con 8 GB).
- **Documentación viva:** endpoint nuevo o cambiado → vault `U/2-2026/SI2/Parcial1/App/Endpoints.md`; error complejo resuelto →
  `.../App/Troubleshooting.md` (Síntoma, Causa, Solución); actualizar el `AGENTS.md` afectado; luego sincronizar Qdrant:
  `/home/lmc/vault-brain/.venv/bin/python /home/lmc/vault-brain/sync_vault.py --sync`.
- Git: `main` es la rama estable; **la app móvil se trabaja en la rama `feat/app-movil`** (creada 2026-11-07 para no chocar con cambios del compañero en `main`). Commits y push cuando el usuario lo pide.

## 6. Decisiones tomadas (no re-discutir)

- Multi-tenant con **BD compartida + `tenant_id`** (los otros dos enfoques solo se comparan en la doc).
- Tienda pública por ruta `/t/<slug>`; el "cliente" del SaaS es el dueño de la tienda (ADMIN del inquilino).
- Móvil: **Expo SDK 58 + SQLite**, rehecha desde cero (spec vault `U/2-2026/SI2/Parcial2/Movil_Spec.md`). **Solo clienta/visitante, sin POS** (el modo Mostrador se eliminó el 2026-11-07). Build Android **local** con Gradle (sin EAS); APK de entrega firmado con el keystore de debug.
- **Decart** (`lucy-vton-3.5`) es el único probador virtual; el AR viejo se borró.
- **Sin POS** (punto de venta), por seguridad: la tienda física tiene su caja; solo la cajera (`CAJERO`), en la web, confirma el efectivo
  (`/admin/cobros`) y el personal resuelve reservas (`/admin/reservas`). `POST /ventas/presenciales` se **borró** el 2026-11-07: la clienta
  en tienda compra lo reservado con `POST /ventas/desde-reserva/:reservaId` (venta `PENDIENTE`; al pagarse, la reserva pasa a `COMPLETADA`).
- Machine Learning en un **servicio Python aparte** (`mirroria-ml`, FastAPI + scikit-learn), consumido por el backend.
- Se mantiene el monolito modular; los microservicios se documentan como camino futuro.
- IA de reportes: DeepSeek arma una "ficha" y el motor corre SQL parametrizado (el modelo nunca escribe SQL).
- **Modo oscuro:** la plataforma MirrorIA sigue el `prefers-color-scheme` del sistema (`useTemaPlataforma`, sin botón); cada tienda tiene
  modo FIJO de marca `CLARO`/`OSCURO` (`inquilino_marca.modo`, desde el plan Crecimiento) que ignora el sistema del visitante
  (`lib/tema/aplicar-tema.ts`); al pasar a oscuro se revalida el contraste. **Sin** toggle de visitante ni modo "Automático":
  no agregarlo sin pedido del usuario. `nomada` es OSCURO; `tiendaria` y `casa-andina`, CLARO.

## 7. Trampas conocidas

- **Nunca reiniciar un `mirroria_backend` con imagen vieja contra una BD nueva:** su `synchronize` borra columnas
  que no conoce (`tenant_id`, `planes.nivel_marca`…). Siempre `docker compose up -d --build --force-recreate`.
  Un `docker restart` tampoco relee `mirroria-backend/.env`.
- Límites por IP en memoria: login 10 cada 5 min, alta de tienda 5 por hora, validar cupón 30/5 min, IA 20/10 min,
  probador 10/10 min. Para resetear en QA: recrear el backend.
- El proceso de Nest se llama `MainThread` (no `node`) para `pgrep`.
- Fechas `timestamp` sin zona: un `UPDATE … now()` desde psql (UTC) queda corrido 4 h frente a la app (-04).
- **Azure:** el próximo despliegue tiene un checklist obligatorio (JWT_SECRET, NODE_ENV, backfill multi-tenant,
  SQL de marca, SQL de renombre `renombre-tiendaria.sql`, env de plataforma) en vault `U/2-2026/SI2/Parcial1/App/Despliegue_Azure.md`. **Recordáselo al usuario
  cuando diga que va a desplegar.** Los despliegues los corre él (`bash scripts/deploy-azure.sh`).

## 8. Pendientes conocidos (no bloquean)

- Fase 6b (backend, no tocado): `GET /dashboard/operativo` no envía `probabilidadNoShow` ("¿Vendrá?" casi no aparece); `/ml/kpis/demanda`
  no trae el nombre de la prenda (el front lo cruza con el catálogo); el prompt de la IA de reportes a veces usa jerga ("ETL") o "$";
  al repivotear un reporte híbrido se pierden sus fechas y no trae narrativa; "Clientas que compraron" da 0 con ventas presenciales sin clienta.
- Dev: si Vite muestra algo "sin estilo" tras crear muchos archivos, reiniciarlo (Tailwind dejó de generar clases; el build de prod está bien).

- P3 de la auditoría 1b: texto muted "Elegí tienda y horario…" de Tiendaria con contraste 4.35:1; el título de pestaña del
  admin dice "MirrorIA" (no el nombre de la tienda); en el paso 2 del alta la vista previa no es sticky.
- Del QA de la Fase 1: el login de `/t/tiendaria` repite el nombre ("Tiendaria / Tiendaria") en el panel de foto.
- Las tiendas demo `casa-andina` y `nomada` están en TRIAL hasta **2026-11-19**: extender desde `/plataforma` si la defensa es después.
- Login/registro sin botón para mostrar la contraseña; dictado por voz de reportes nunca probado en un navegador real.
- Refresh token: la tabla existe, el flujo no (JWT de 1 h).
