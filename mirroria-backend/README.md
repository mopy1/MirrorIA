# mirroria-backend

API de **MirrorIA**, plataforma SaaS multi-tenant de tiendas de moda femenina
(Tiendaria es una de sus tiendas, slug `tiendaria`). NestJS + TypeORM + PostgreSQL 16, ESM.
Prefijo global `/api/v1` (101 rutas), Swagger en `/api/docs` fuera de producción.
12 módulos en `src/modules/` (seguridad, catalogo, proveedores, sucursales, inventario,
ventas, reservas, promociones, pagos, ia, probador, saas); infraestructura y multi-tenant
en `src/core/` (`core/tenancy`). Toda ruta de negocio necesita la cabecera
`X-Tenant: <slug>` o un JWT de esa tienda.

## Correr en desarrollo

```bash
cp .env.example .env         # completar JWT_SECRET (openssl rand -hex 32) y PLATAFORMA_EMAIL/PASSWORD; claves externas opcionales
docker compose up -d postgres-db   # desde la raíz: Postgres en localhost:5435
npm install
npm run start:dev            # http://localhost:3000/api/v1
curl -H 'X-Tenant: tiendaria' localhost:3000/api/v1/catalogo/productos
```

## Verificar

```bash
npx tsc --noEmit -p tsconfig.build.json   # tipos
npm test                                  # vitest (unit, 351)
npm run test:e2e                          # vitest e2e (56, usa la BD local)
npm run lint                              # oxlint
```

## Docker

Desde la raíz del monorepo: `docker compose up -d --build` levanta
`mirroria_postgres` (:5435), `mirroria_backend` (:3000) y `mirroria_frontend` (:80).

Arquitectura, módulos, endpoints y reglas: [`AGENTS.md`](./AGENTS.md).
