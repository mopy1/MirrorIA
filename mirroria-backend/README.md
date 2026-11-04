# mirroria-backend

API de **MirrorIA** (e-commerce multi-sucursal de moda femenina). NestJS +
TypeORM + PostgreSQL 16, ESM. Prefijo global `/api/v1`, Swagger en `/api/docs`.
Un módulo por subdominio en `src/modules/` (seguridad, catálogo, inventario,
ventas, reservas, pagos, ia, probador, ...); infraestructura en `src/core/`.

## Correr en desarrollo

```bash
cp .env.example .env         # defaults de dev listos; claves externas opcionales
docker compose up -d postgres-db   # desde la raíz: Postgres en localhost:5435
npm install
npm run start:dev            # http://localhost:3000/api/v1
```

## Verificar

```bash
npx tsc --noEmit -p tsconfig.build.json   # tipos
npm test                                  # vitest (unit)
npm run test:e2e                          # vitest e2e
npm run lint                              # oxlint
```

## Docker

Desde la raíz del monorepo: `docker compose up -d --build` levanta
`mirroria_postgres` (:5435), `mirroria_backend` (:3000) y `mirroria_frontend` (:80).

Arquitectura, módulos, endpoints y reglas: [`AGENTS.md`](./AGENTS.md).
