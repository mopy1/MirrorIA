# HANDOFF — punto de entrada para una IA nueva

> Actualizado: 2026-11-05, commit `f91938c` (rama `main`). Si el código cambió después, el código manda:
> verificá con los comandos de la sección 4 y corregí este archivo.

## 1. Qué es esto (en 6 líneas)

- **Tiendaria** es una plataforma **SaaS multi-tenant** (*Software as a Service* con varios inquilinos)
  de tiendas online de moda femenina: cualquier boutique elige un plan, se da de alta y recibe su
  tienda en `/t/<slug>`, con su marca, sucursales, catálogo, reservas, pagos, reportes por IA y probador virtual.
- **MirrorIA** es **una tienda más** dentro de Tiendaria (slug `mirroria`). Antes (Parcial 1) el proyecto
  entero se llamaba MirrorIA; por eso el repo, los contenedores, las variables de entorno y algunos
  correos siguen diciendo `mirroria`. No se renombran.
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
| 1b — Tiendaria: marca por tienda + panel de plataforma | ✅ cerrada, commit `f91938c` |
| **2 — Pasarelas enchufables** | ⏭️ **la siguiente**. Interfaz común + registro de proveedores. Funcionan Wayra (QR simulado) y Stripe; **PayPal y un QR bancario real se agregan como alternativas VACÍAS** ("no configurada", no aparecen en el checkout) por decisión del usuario. También el cobro de la suscripción SaaS (hook ya existente: `SuscripcionesService.activarPorPago`, y la pantalla `/admin/suscripcion/activar` con pasarelas "Próximamente"). |
| 3 — Offline/PWA, idempotencia y conflictos | pendiente |
| 4 — Reportes dinámicos (+ Excel) | pendiente |
| 5 — BI: dashboards por rol | pendiente |
| 6 — Machine Learning (servicio Python aparte) | pendiente |
| 7 — Documento ICONIX + UML 2.5 → PDF | pendiente (capítulos 01 y 02 ya escritos; índice en `Parcial2/Documentacion/00_Indice.md`) |

Números verificados en `f91938c`: **101 rutas** HTTP, **28 tablas**, **351** tests unitarios backend (41 archivos),
**112** tests frontend (20 archivos), e2e backend 56/56 (última corrida de la auditoría 1b).

## 3. Orden de lectura

1. Este archivo.
2. `AGENTS.md` (raíz): árbol del monorepo, puertos, comandos, mapa front ↔ back.
3. El `AGENTS.md` del paquete que vas a tocar: `mirroria-backend/AGENTS.md` (módulos y tabla de las 101 rutas)
   o `mirroria-frontend/AGENTS.md` (rutas, guards, features). `mirroria-mobile/` está congelada: no la toques.
4. En el vault: `U/2-2026/SI2/Parcial2/Plan_Parcial2.md` y la spec de la fase en curso
   (`Fase1_Spec_MultiTenant.md`, `Fase1b_Spec_Personalizacion_Tiendaria.md` son el modelo a seguir).
5. Contratos y datos: vault `U/2-2026/SI2/Parcial1/App/` (`Endpoints.md`, `Database.md`, `Reglas_de_Negocio.md`,
   `Troubleshooting.md`, `Despliegue_Azure.md`). Pese a la carpeta "Parcial1", son las notas vivas de la app actual.

## 4. Levantar y verificar

```bash
cd /home/lmc/projects/MirrorIA
docker compose up -d --build --force-recreate   # mirroria_postgres :5435 · mirroria_backend :3000 · mirroria_frontend :80
# o en dev: docker compose up -d postgres-db ; (cd mirroria-backend && npm run start:dev) ; (cd mirroria-frontend && npm run dev)  → web :5174
docker logs mirroria_backend 2>&1 | grep -oE 'Mapped \{[^}]+\}' | sort -u | wc -l     # 101
curl -H 'X-Tenant: mirroria' localhost:3000/api/v1/catalogo/productos                  # toda ruta de negocio necesita la tienda
```

- API: prefijo `/api/v1`, Swagger en `/api/docs` (solo fuera de producción). Toda ruta de negocio necesita
  la cabecera **`X-Tenant: <slug>`** (sin sesión) o un JWT de esa tienda; sin ninguna → 400.
- Web: `/` landing de Tiendaria · `/t/mirroria` (y `/t/casa-andina`, `/t/nomada`) tiendas · `/admin` panel de la
  tienda del usuario logueado · `/plataforma` panel del dueño de la plataforma.
- **Cuentas de prueba (solo BD local; la clave común de desarrollo NO se versiona, está en el vault):** lista completa y clave en vault
  `U/2-2026/SI2/Parcial1/App/Database.md` → "Estado de la BD local". Atajos: `admin@mirroria.com` (ADMIN de MirrorIA),
  `rosa@casa-andina.bo`, `camila@nomada.bo` (ADMIN de las tiendas demo). La cuenta de plataforma
  `plataforma@mirroria.com` (rol `DUENO_PLATAFORMA`) usa `PLATAFORMA_PASSWORD` de `mirroria-backend/.env`.
- `NODE_ENV=development` en el `.env` local **a propósito** (activa `synchronize` de TypeORM y Swagger). Azure usa `production`.

**Tests y QA:**

```bash
cd mirroria-backend && npx vitest run          # 351 unit
cd mirroria-backend && npm run test:e2e        # 56 e2e, necesita Postgres (escribe en la BD local)
cd mirroria-frontend && npx vitest run         # 112
cd mirroria-frontend && npx tsc -b --noEmit && npm run lint
python3 scripts/qa/qa_reglas.py      # 21  · qa_mostrador.py 14 · qa_aislamiento.py 84 · qa_marca.py 37
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
- Git: **una sola rama, `main`**; commits y push a `main` permitidos cuando el usuario lo pide.

## 6. Decisiones tomadas (no re-discutir)

- Multi-tenant con **BD compartida + `tenant_id`** (los otros dos enfoques solo se comparan en la doc).
- Tienda pública por ruta `/t/<slug>`; el "cliente" del SaaS es el dueño de la tienda (ADMIN del inquilino).
- Móvil: **Expo + SQLite**, la app actual (`mirroria-mobile/`) está **congelada**; en este parcial el móvil solo se diseña.
- **Decart** (`lucy-vton-3.5`) es el único probador virtual; el AR viejo se borró.
- **Sin POS** (punto de venta): la tienda física tiene su caja; la web solo confirma efectivo (`/admin/cobros`) y
  resuelve reservas (`/admin/reservas`). `POST /ventas/presenciales` existe sin pantalla.
- Machine Learning en un **servicio Python aparte** (`mirroria-ml`, FastAPI + scikit-learn), consumido por el backend.
- Se mantiene el monolito modular; los microservicios se documentan como camino futuro.
- IA de reportes: DeepSeek arma una "ficha" y el motor corre SQL parametrizado (el modelo nunca escribe SQL).
- **Modo oscuro:** Tiendaria sigue el `prefers-color-scheme` del sistema (`useTemaTiendaria`, sin botón); cada tienda tiene
  modo FIJO de marca `CLARO`/`OSCURO` (`inquilino_marca.modo`, desde el plan Crecimiento) que ignora el sistema del visitante
  (`lib/tema/aplicar-tema.ts`); al pasar a oscuro se revalida el contraste. **Sin** toggle de visitante ni modo "Automático":
  no agregarlo sin pedido del usuario. `nomada` es OSCURO; `mirroria` y `casa-andina`, CLARO.

## 7. Trampas conocidas

- **Nunca reiniciar un `mirroria_backend` con imagen vieja contra una BD nueva:** su `synchronize` borra columnas
  que no conoce (`tenant_id`, `planes.nivel_marca`…). Siempre `docker compose up -d --build --force-recreate`.
  Un `docker restart` tampoco relee `mirroria-backend/.env`.
- Límites por IP en memoria: login 10 cada 5 min, alta de tienda 5 por hora, validar cupón 30/5 min, IA 20/10 min,
  probador 10/10 min. Para resetear en QA: recrear el backend.
- El proceso de Nest se llama `MainThread` (no `node`) para `pgrep`.
- Fechas `timestamp` sin zona: un `UPDATE … now()` desde psql (UTC) queda corrido 4 h frente a la app (-04).
- **Azure:** el próximo despliegue tiene un checklist obligatorio (JWT_SECRET, NODE_ENV, backfill multi-tenant,
  SQL de marca, env de plataforma) en vault `U/2-2026/SI2/Parcial1/App/Despliegue_Azure.md`. **Recordáselo al usuario
  cuando diga que va a desplegar.** Los despliegues los corre él (`bash scripts/deploy-azure.sh`).

## 8. Pendientes conocidos (no bloquean)

- P3 de la auditoría 1b: texto muted "Elegí tienda y horario…" de MirrorIA con contraste 4.35:1; el título de pestaña del
  admin dice "Tiendaria" (no el nombre de la tienda); en el paso 2 del alta la vista previa no es sticky; la cuenta de
  plataforma se llama "Plataforma MirrorIA" (dato).
- Del QA de la Fase 1: el login de `/t/mirroria` muestra "MirrorIA / MirrorIA" en el panel de foto.
- El QR de cobro (Wayra) dice `comercio: "MirrorIA"` en todas las tiendas (`COMERCIO_QR` fijo en `cobro-qr.service.ts`): corregir en la Fase 2.
- Las tiendas demo `casa-andina` y `nomada` están en TRIAL hasta **2026-11-19**: extender desde `/plataforma` si la defensa es después.
- Login/registro sin botón para mostrar la contraseña; dictado por voz de reportes nunca probado en un navegador real.
- Refresh token: la tabla existe, el flujo no (JWT de 1 h).
