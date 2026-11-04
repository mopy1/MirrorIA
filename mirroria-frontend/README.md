# mirroria-frontend

Tienda web de **MirrorIA** (e-commerce multi-sucursal de moda femenina) y panel
de administración `/admin/*`. React 19 + Vite + Tailwind v4 + shadcn/ui,
organizado por features (`src/features/<modulo>/`).

## Correr en desarrollo

```bash
npm install
npm run dev          # http://localhost:5174 (el backend tiene que estar en :3000)
```

`VITE_API_URL` apunta al backend (`http://localhost:3000/api/v1` en dev).

## Verificar

```bash
npx tsc -b --noEmit  # tipos
npm test             # vitest
npm run lint         # oxlint
npm run build        # tsc + vite build -> dist/
```

## Docker

Desde la raíz del monorepo: `docker compose up -d --build`. El contenedor
`mirroria_frontend` sirve `dist/` con Nginx en `:80` y hace proxy de `/api/`
al backend. `nginx.conf` es la config de desarrollo (HTTP plano);
`nginx.prod.conf` es la de la VM (dominio + Let's Encrypt), elegida por
`docker-compose.prod.yml`.

Arquitectura, rutas y convenciones: [`AGENTS.md`](./AGENTS.md).
