# 🟣 MirrorIA — Manual maestro del monorepo

> **Si sos una IA nueva en este proyecto, leé [`HANDOFF.md`](./HANDOFF.md) primero** (estado, reglas del usuario,
> decisiones tomadas y trampas). Este archivo es el mapa técnico del monorepo.
>
> Actualizado: 2026-11-09 (integración `main` + `feat/app-movil`, sin POS) · rama única `main`.

## 1. Qué es

> **2026-11-05: se intercambiaron los nombres** — la plataforma SaaS se llama **MirrorIA** (como el repo) y la tienda
> principal se llama **Tiendaria** (slug `tiendaria`); en specs/commits anteriores al cambio, 'Tiendaria' significa la plataforma.

**MirrorIA** es una plataforma **SaaS multi-tenant** (*Software as a Service*: un solo sistema que atiende a muchas
tiendas, cada una aislada como "inquilino") de e-commerce de moda femenina multi-sucursal: probador virtual por IA
(Decart `lucy-vton-3.5`), reservas para probarse en tienda, carrito y checkout con cupones, pagos (tarjeta Stripe,
PayPal, QR dinámico con el banco simulado Wayra, efectivo confirmado por la cajera), reportes por IA en lenguaje natural (DeepSeek + DuckDB, exportables a Excel y PDF) y un
panel de plataforma para el dueño del SaaS.

**Tiendaria es una tienda más** (slug `tiendaria`, `/t/tiendaria`, marca vino/rosa, datos del Parcial 1). El repo, los
contenedores (`mirroria_*`), la BD (`mirroria_db`), las env y los correos `*@mirroria.com` dicen `mirroria`.

Proyecto del **Parcial 2 de SI2** (Sistemas de Información II, 2-2026), entrega 2026-11-11 08:00 (PDF ICONIX + UML 2.5).
Documentación en el vault de Obsidian (`/mnt/c/Users/lmc/Documents/Obsidian`):

```text
U/2-2026/SI2/
├── Parcial2/                     # 2.º parcial (vigente)
│   ├── Enunciado.md · Plan_Parcial2.md (estado por fase)
│   ├── Fase1_Spec_MultiTenant.md · Fase1b_Spec_Personalizacion_Tiendaria.md · Fase2_Spec_Pasarelas.md · Fase3_Spec_Offline_Idempotencia.md · Fase4_Spec_Reportes_Dinamicos_Excel.md · Fase5_Spec_BI_Dashboards.md · Fase6_Spec_MachineLearning_KPIs.md   # specs implementadas
│   └── Documentacion/            # capítulos del PDF (00_Indice.md, 01_*, 02_*, betaICONIX.md)
└── Parcial1/
    ├── App/                      # notas VIVAS de la app: Endpoints, Database (DBML), Backend, Frontend,
    │                             # Reglas_de_Negocio, Troubleshooting, Despliegue_Azure, Mobile (congelada)
    └── Documentacion/            # dossier PUDS de la entrega 1 (histórico)
```

> El PDF del enunciado del Parcial 1 sugería Python+FastAPI / Angular / Flutter: **no es el stack real** (decisión del usuario).

## 2. Stack y puertos

| Parte | Tecnología | Puerto local | Contenedor |
|---|---|---|---|
| Base de datos | PostgreSQL 16 (`pgcrypto`) | `127.0.0.1:5435` → 5432 | `mirroria_postgres` (volumen `mirroria_pgdata`) |
| Backend | NestJS 12, Node 24, TypeScript ESM, TypeORM 1.x | `127.0.0.1:3000` (`/api/v1`, Swagger `/api/docs` fuera de prod) | `mirroria_backend` |
| Machine Learning | Python 3.12, FastAPI, scikit-learn, pandas, joblib | `127.0.0.1:8002` (FastAPI interno / proxy en backend) | `mirroria_ml` |
| Frontend | React 19, Vite, Tailwind v4, shadcn/ui (Base UI), Phosphor | `5174` en dev · `80` en Docker (Nginx + proxy `/api/`) | `mirroria_frontend` |
| Móvil | Expo SDK 58 (RN 0.88, New Arch) + SQLite + Decart/LiveKit — solo clienta/visitante, *development build* / APK Android | `8081` (Metro del dev build) | — |
| Despliegue | Azure VM (`https://mirroria.duckdns.org`), `scripts/deploy-azure.sh` | 443 | override `docker-compose.prod.yml` |

Credenciales de Postgres de desarrollo: usuario `mirroria`, base `mirroria_db`, password en `.env` de la raíz
(`POSTGRES_PASSWORD`). El backend lee `mirroria-backend/.env` (plantilla `.env.example`).

## 3. Árbol del monorepo

```text
/home/lmc/projects/MirrorIA/
├── HANDOFF.md                   # entrada para una IA nueva
├── AGENTS.md                    # este manual
├── docker-compose.yml           # DEV: postgres + backend + frontend (HTTP plano en :80), sin restart
├── docker-compose.prod.yml      # override SOLO para la VM (nginx.prod.conf + Let's Encrypt en :443)
├── db/init/001-extensions.sql   # CREATE EXTENSION pgcrypto en el primer arranque del volumen
├── .env / .env.example          # POSTGRES_PASSWORD
├── docs/
│   ├── parcial2/                # Documentación formal Parcial 2 (ICONIX, 17 CUs Omnicanal, DDL 30 tablas, PDF, DOCX, diagramas PNG)
│   └── superpowers/            # specs y registros de decisiones de `ia` (CU24) y `pagos` (RF19), 2026-09-21 (históricos)
├── scripts/
│   ├── deploy-azure.sh          # despliegue a la VM por git bundle + scp (lo corre el usuario)
│   ├── sembrar-catalogo.mjs + catalogo-demo.mjs   # catálogo demo idempotente contra la API
│   ├── sembrar-tiendas-demo.mjs # tiendas demo casa-andina y nomada (marca, prendas, clientas, ventas)
│   ├── sql/fase1-multitenant-backfill.sql   # tenant_id + datos a la tienda demo (id …0001; hoy "tiendaria")
│   ├── sql/fase1b-marca.sql     # Azure: inquilino_marca, eventos_plataforma, planes.nivel_marca/destacado
│   ├── sql/renombre-tiendaria.sql  # Azure: tienda demo "MirrorIA"/mirroria → "Tiendaria"/tiendaria (idempotente)
│   ├── sql/parcial2-esquema.sql # idempotencia, cobros_suscripcion, ventas.clave_idempotencia (idempotente; correr antes del backend nuevo)
│   └── qa/                      # QA contra la API real: reglas 21, compra_reserva 26, aislamiento 84, marca 37 (ver su README)
├── mirroria-backend/            # NestJS — ver mirroria-backend/AGENTS.md (módulos + tabla de las rutas; 121 en total)
│   └── src/{core,modules}/      # core: config, database, exception, security, tenancy · 14 módulos de negocio (incluye bi y ml)
├── mirroria-ml/                 # Python 3.12 + FastAPI + scikit-learn — ver mirroria-ml/AGENTS.md (puerto 8002)
│   └── {app,dataset,models,scripts,tests}/ # 4 modelos M1-M4 entrenados con seed=42 y atados a KPIs
├── mirroria-frontend/           # React — ver mirroria-frontend/AGENTS.md (rutas, guards, features)
│   └── src/{features,components,layouts,routes,lib,context,hooks,types}/
└── mirroria-mobile/             # Expo SDK 58 — ver mirroria-mobile/AGENTS.md (clienta offline, pagos, reservas, probador Decart; APK en dist/)
```

## 4. MirrorIA (plataforma) vs. las tiendas

| | MirrorIA (plataforma) | Cada tienda (inquilino) |
|---|---|---|
| Rutas web | `/`, `/planes`, `/registro-tienda`, `/entrar`, `/plataforma/*`, `/wayra/pagar/:token` | `/t/:slug/*` (vitrina, carrito, pago…) y `/admin/*` (panel de SU tienda) |
| Identidad | índigo `#281B89` + lima `#C3F74C`, Bricolage Grotesque | su marca (`inquilino_marca`): logo, colores, modo, bordes, fuente, portada, textos, redes |
| Quién la opera | `DUENO_PLATAFORMA` (`plataforma@mirroria.com`, sin tienda) | `ADMIN`, `ENCARGADO_SUCURSAL`, `CAJERO`, `CUSTOMER` de esa tienda |
| Backend | `/saas/*` (tablas globales `planes`, `inquilinos`, `suscripciones`, `inquilino_marca`, `eventos_plataforma`) | resto de las rutas, filtradas por `tenant_id` |

Planes: **Básico** (Bs 99, 1 sucursal, 50 prendas, 3 staff, marca ESENCIAL) · **Crecimiento** (Bs 249, 3/300/10,
COMPLETA, destacado) · **Cadena** (Bs 599, sin límites, MARCA_BLANCA). Toda tienda nueva arranca en prueba (TRIAL) de 14 días.
Tiendas locales: `tiendaria` (Cadena ACTIVA hasta 2027-12-31, datos del Parcial 1), `casa-andina` y `nomada`
(Cadena TRIAL hasta 2026-11-19). Cuentas: vault `Parcial1/App/Database.md` → "Estado de la BD local".

## 5. Mapa frontend ↔ backend

| Feature front (`src/features/`) | Rutas web | Módulo backend → prefijo |
|---|---|---|
| `saas` | `/`, `/planes`, `/registro-tienda`, `/entrar` | `saas` → `/saas/planes`, `/saas/tiendas*`, `/saas/estadisticas` |
| `platform` | `/plataforma/*` | `saas` → `/saas/plataforma/*`; `sucursales` → `/sucursales/ciudades` |
| `subscription`, `appearance` | `/admin/suscripcion[/activar]`, `/admin/apariencia` | `saas` → `/saas/mi-suscripcion*`, `/saas/mi-marca*` |
| `auth` | `/t/:slug/login`, `/t/:slug/registro`, `/plataforma/login` | `seguridad` → `/seguridad/auth/*` |
| `catalog`, `branches` | `/t/:slug`, `/t/:slug/tienda[/producto/:id]`, `/t/:slug/sucursales` | `catalogo`, `sucursales`, `inventario` (GET) |
| `cart`, `checkout`, `orders` | `/t/:slug/carrito`, `/checkout`, `/mis-pedidos` | `ventas` → `/ventas/carrito/*`, `/ventas/mias`; `promociones` → `/promociones/cupones/validar` |
| `payments`, `wayra` | `/t/:slug/pago/*`, `/wayra/pagar/:token` | `pagos` → `/pagos/*`, `/wayra/*` |
| `reservations` | `/t/:slug/reservas` + botón en la ficha | `reservas` → `/reservas/*` |
| `fitting` | `/t/:slug/probador[/:productoId]` | `probador` → `/probador/token` |
| `dashboard` | `/admin/dashboard` (redirección `/admin`) | `bi` → `/dashboard/*` (Fase 5: ejecutivo y operativo "Hoy en la tienda") |
| `ml` | `/admin/ml` | `ml` → `/ml/*` (Fase 6: demanda, no-show, RFM, anomalías) |
| `reports` | `/admin/reportes` | `ia` → `/ia/*` (Excel y PDF: `/ia/reportes/exportar-{excel,pdf}`) |
| `admin`, `inventory`, `promotions`, `providers` | `/admin/{catalogo,proveedores,sucursales,cupones,usuarios,inventario,ventas,reservas,cobros}` | `catalogo`, `proveedores`, `sucursales`, `promociones`, `seguridad/usuarios`, `inventario`, `ventas`, `reservas`, `pagos` |

Cliente HTTP: `mirroria-frontend/src/lib/api.ts` (`apiFetch`) manda `X-Tenant` = tienda navegada (o la de la sesión) y
el JWT solo si la sesión es de esa tienda.

## 6. Reglas transversales

1. **Monolito modular:** un módulo de negocio no importa entidades de otro; referencias entre módulos = columna `uuid`
   simple. Para validar contra otro módulo se inyecta su *service exportado*. `core/` nunca importa de `modules/`.
2. **Multi-tenant:** BD compartida + `tenant_id` en 21 tablas. Toda ruta de negocio opera sobre UNA tienda (`X-Tenant:
   <slug>` sin sesión, o el `tenantId` del JWT; cabecera de otra tienda con sesión → 403). Toda consulta lleva
   `soloTenant()`; un id de otra tienda → 404. Detalle en `mirroria-backend/AGENTS.md` §4.
3. `id` siempre `uuid DEFAULT gen_random_uuid()` (pgcrypto). Errores con shape único `{ status, message, timestamp }`.
4. Catálogo exclusivamente femenino: no hay campo ni tabla de género.
5. Seguridad: `JWT_SECRET` obligatorio (≥ 32 caracteres), límites por IP (login, cupón, IA, probador, alta de tienda),
   nunca 0 ADMIN activos, staff acotado a su sucursal.
6. **Sin POS** a propósito (ni web, ni backend, ni móvil): la cajera solo confirma efectivo (`/admin/cobros`) y el personal
   resuelve reservas (`/admin/reservas`); la clienta en tienda compra lo reservado con `POST /ventas/desde-reserva/:reservaId`.

## 7. Comandos rápidos

```bash
docker compose up -d --build --force-recreate        # todo: :5435, :3000, :80 (siempre recrear tras cambiar código)
docker compose up -d postgres-db                     # solo la BD
cd mirroria-backend && npm run start:dev             # API en :3000
cd mirroria-frontend && npm run dev                  # web en :5174
curl -H 'X-Tenant: tiendaria' localhost:3000/api/v1/catalogo/productos
docker logs mirroria_backend 2>&1 | grep -oE 'Mapped \{[^}]+\}' | sort -u | wc -l   # 121 rutas

# Tests
cd mirroria-backend && npx vitest run                # 568 unit (66 suites) · npm run test:e2e → 62 (usa la BD local)
cd mirroria-frontend && npx vitest run               # 346 unit (62 suites)
cd mirroria-mobile && npx tsc --noEmit && npm test   # 59
cd mirroria-ml && .venv/bin/python -m pytest -q      # 6

# QA contra la API local (ensucia la BD: pg_dump antes, pg_restore --clean después)
python3 scripts/qa/qa_reglas.py     # 21 · qa_compra_reserva.py 26 · qa_aislamiento.py 84 · qa_marca.py 37

# Tiendas demo (contra una API con las tablas 1b)
PLATAFORMA_EMAIL=… PLATAFORMA_PASSWORD=… node scripts/sembrar-tiendas-demo.mjs --api http://localhost:3000/api/v1
```

## 8. Historial condensado

- **2026-09-12 → 09-29 (Parcial 1):** 11 módulos (`seguridad`, `catalogo`, `proveedores`, `sucursales`, `inventario`,
  `ventas`, `reservas`, `promociones`, `pagos`, `ia`, `probador`), 23 tablas, e-commerce web completo, reglas
  anti-acaparamiento y flujo de mostrador, probador migrado del AR propio a Decart, separación `nginx.conf`/`nginx.prod.conf`.
- **2026-11-03:** merge de `pago-qr` (QR dinámico con banco simulado Wayra, firma HMAC), concurrencia de stock/cobros
  con `UPDATE` condicionados, "volver al carrito", alcance por sucursal en ventas/cobros/inventario.
- **2026-11-04:** endurecimiento de seguridad, limpieza (fuera AR, `lucide-react`, ramas viejas), móvil congelado,
  motor IA híbrido (DuckDB + agente multi-herramienta), "Mis pedidos" y edición de cantidad en el carrito.
- **2026-11-05 — Fase 1 (`d6d05f6`):** SaaS multi-tenant (módulo `saas`, `core/tenancy`, 93 rutas, 26 tablas).
- **2026-11-05 — Fase 1b (`f91938c`):** identidad de la plataforma (entonces "Tiendaria"), marca por tienda (`/admin/apariencia`), panel de
  plataforma con dashboard y bitácora, tiendas demo (101 rutas, 28 tablas).
- **2026-11-05 — Renombre:** la plataforma pasa a llamarse MirrorIA y la tienda demo `mirroria` → Tiendaria (`tiendaria`);
  BD: `scripts/sql/renombre-tiendaria.sql` (idempotente).
- **2026-11-05 — Fase 2 (`b4eaa0a`):** Pasarelas enchufables (`RegistroPasarelasService`, adaptadores Stripe y Wayra QR unificados para checkout y suscripciones, stubs 503 para PayPal y QR Bancario, cobros de suscripción B2B en `/admin/suscripcion/activar`, tabla `cobros_suscripcion`, 105 rutas, 29 tablas, 385 tests back, 127 tests front).
- **2026-11-06 — Fase 3 (`48b1e54`):** Offline, PWA, Idempotencia y Conflictos (PWA + Service Worker con cache App Shell, IndexedDB con TTL 7d y outbox FIFO, tabla `idempotencia` en backend con hashing SHA-256 canónico, interceptor HIT/MISS/422/409, resolución de conflicto `stock = 1` con error 409 tipado y transacción compensatoria, 105 rutas, 30 tablas, 404 tests back, 140 tests front).
- **2026-11-06 — Fase 4:** Reportes dinámicos, tabla pivote, métricas cruzadas y exportación a Excel (`TablaDinamicaReporte` con ordenación interactiva, filtrado y repivoteo en caliente; `ConstructorReporteDialog` estructurado sin coste de LLM; exportación nativa a `.xlsx` con `exceljs` con formato contable `"Bs" #,##0.00`, fórmulas de totales y auto-ajuste; nuevas dimensiones `metodo_pago`, `proveedor_pago` y `proveedor`, 106 rutas, 30 tablas, 425 tests back, 159 tests front).
- **2026-11-06 — Fase 5:** BI y Dashboards diferenciados (Ejecutivo ADMIN con KPIs de facturación, ticket promedio, rotación y conversión, y Operativo "Hoy en la tienda" con agenda cronológica de reservas, cobros pendientes y alertas de quiebre de stock por sucursal).
- **2026-11-06 — Fase 6:** Machine Learning Operativo + Microservicio Python FastAPI :8002 (Random Forest Regressor para demanda a 30d, Regresión Logística L2 para riesgo de No-Show, K-Means para segmentación RFM, Isolation Forest para auditoría de ventas atípicas; datasets reproducibles `seed=42`, $N=10.000$; rediseño de Storefront Luxury Navbar y Dashboard ML con toolbar unificada `ml-toolbar.tsx`, sin pestañas apiladas, Ficha Técnica SI2 modal secundaria y humanización integral de nombres de prendas y tickets, 198 tests en frontend, 466 en backend).

- **2026-11-06 — Fase 6b:** Rediseño UX/UI del panel admin para un gerente sin tecnicismos (solo frontend): menú lateral en acordeón (Inicio · Ventas · Productos · Análisis · Mi negocio, contraíble a íconos), Dashboard BI ("Resumen del negocio" con resumen en palabras y "Hoy en la tienda"), Predicciones ("Qué hacer esta semana", jerga técnica solo en "¿Cómo se calcula?") y Reportes con IA (markdown renderizado con `react-markdown`, lienzo con conclusión, cifras clave, barras con nombres completos, chat con conclusión corta + "Reporte listo"). Spec: vault `Parcial2/Fase6b_Spec_Rediseno_UX_Admin.md`. 293 tests front (52 suites).
- **2026-11-07/08 — App móvil (rama `feat/app-movil`):** `mirroria-mobile/` rehecha desde cero con Expo SDK 58: espejo SQLite + `OutboxManager` (compra/reserva offline, conflicto `stock = 1`), pagos QR/Stripe/caja, reservas y Pase de Tienda, escáner de etiqueta, avisos de reposición, probador Decart en vivo (LiveKit) y APK Android compilado localmente.
- **2026-11-07/08 — `main` (Santiago):** PayPal real en compras y suscripciones, Stripe con `STRIPE_MONEDA=usd` + `TIPO_CAMBIO_BOB_USD`, exportar reportes a PDF (`pdfkit`), ML con los datos reales de cada tienda, idempotencia atada a persona y ruta, compras simultáneas sin colgar la API (pool `DB_POOL_MAX`), PWA sin red, pago simulado solo fuera de producción, `scripts/sql/parcial2-esquema.sql`.
- **2026-11-09 — Integración (`integracion-parcial2`):** `feat/app-movil` sobre `main`; queda la app móvil nueva (SDK 58, solo clienta) y se quita el POS que traía `main` (`/admin/mostrador`, `GET /inventario/mostrador`, caja offline, columnas de precio anterior). 121 rutas, 568 tests back, 346 front, 59 móvil.
- **2026-11-07 — Documentación Parcial 2 (ICONIX & Omnicanal):** Especificación completa para SI2 Parcial 2 siguiendo guía de grupo #22 (Capítulos I al VII, 17 CUs Omnicanal unificados Web PWA + Móvil Expo, DDL SQL 30 tablas, 15 diagramas PNG alta resolución, compilador autónomo `compilar.py`, documento compilado en PDF de 66 páginas y DOCX Word editable en `docs/parcial2/`).

## 9. Dónde está cada cosa

- Reglas de negocio (topes, vencimientos, compra desde la reserva, planes, marca): vault `Parcial1/App/Reglas_de_Negocio.md`.
- Contrato de cada ruta: vault `Parcial1/App/Endpoints.md`. Esquema + DBML + cuentas locales: `Parcial1/App/Database.md`.
- Despliegue y **checklist obligatorio del próximo despliegue**: vault `Parcial1/App/Despliegue_Azure.md`.
- Errores resueltos: vault `Parcial1/App/Troubleshooting.md`.
- Documentación Parcial 2 (ICONIX, 17 CUs Omnicanal, 30 tablas, PDF, DOCX): `docs/parcial2/` y vault `U/2-2026/SI2/Parcial2/Documentacion/`.
- GitHub `mopy1/MirrorIA`: una sola rama `main`; push permitido cuando el usuario lo pide.
