# 🪞 MirrorIA — Monorepo Master Architecture & AI Agent Operating Manual

## 🌐 1. Qué es este proyecto

**MirrorIA** es el proyecto del Examen 1 de Sistemas de Información II (S2-2026): una
plataforma de e-commerce **multi-sucursal, exclusivamente de moda femenina**, con vestidor
virtual por realidad aumentada, reservas de prendas para probar en tienda, punto de venta
presencial y digital, y un asistente/recomendador con IA. El enunciado completo, el diseño de
base de datos (23 tablas, DBML) y las decisiones de diseño viven en el vault de Obsidian, no
en este repo:

```
/mnt/c/Users/lmc/Documents/Obsidian/U/2-2026/SI2/Parcial1/
├── Examen1-Ecommerce-Si2-s2-26.pdf   # enunciado original del profesor
└── Database/
    ├── Diseño_BD.md                  # esquema relacional + decisiones + tradeoffs documentados
    └── dbdiagram.dbml                # DBML 1:1 con Diseño_BD.md, listo para dbdiagram.io
```

> [!IMPORTANT]
> El enunciado del PDF sugiere Python+FastAPI / Angular / Flutter — **no es el stack real**.
> El stack de este repo (abajo) es una decisión explícita del usuario, distinta a la del PDF.

## 🛠️ 2. Stack real

| Componente | Tecnología |
|---|---|
| Backend | **NestJS** (Node 24, TypeScript ESM, TypeORM + PostgreSQL) |
| Frontend web | **React** |
| Móvil | **React Native** |
| Base de datos | **PostgreSQL 16** |
| Despliegue | **Azure** |

## 📁 3. Topología del Monorepo

```text
/home/lmc/projects/MirrorIA/
├── docker-compose.yml          # Postgres 16 (único servicio dockerizado por ahora)
├── db/init/001-extensions.sql  # crea pgcrypto automáticamente en el primer arranque del volumen
├── .env / .env.example         # POSTGRES_PASSWORD compartido por docker-compose
├── AGENTS.md                   # 🌟 Este manual maestro
│
├── mirroria-backend/           # 🪞 NestJS — ver mirroria-backend/AGENTS.md (fuente de verdad)
│   ├── AGENTS.md                # arquitectura, convenciones, estado real de cada módulo
│   ├── package.json
│   └── src/
│       ├── core/                # infraestructura transversal (config, security, exception)
│       └── modules/              # un módulo por subdominio (seguridad, catalogo, ventas, ...)
│
├── mirroria-frontend/          # ⚛️ React 19 + Tailwind v4 + shadcn/ui — ver mirroria-frontend/AGENTS.md
│   └── AGENTS.md
│
└── mirroria-mobile/            # 📱 React Native + Expo SDK 57 + NativeWind v4 + RNR — ver mirroria-mobile/AGENTS.md
    └── AGENTS.md                # arquitectura modular (feature-based), auth login/register completado
```

## 🐘 4. Base de datos: cómo levantarla

```bash
cd /home/lmc/projects/MirrorIA
docker compose up -d postgres-db
```

Esto expone Postgres en `localhost:5435` (no `5432`, para no chocar con los otros proyectos
del usuario — `erp` usa `5432`, `sw-case` usa `5434`), crea la extensión `pgcrypto`
automáticamente (`db/init/001-extensions.sql`), y persiste datos en el volumen nombrado
`mirroria_pgdata`. Credenciales de desarrollo por defecto (`.env`, gitignoreado):
usuario `mirroria`, password `mirroria_password123`, base `mirroria_db`.

## 🏛️ 5. Reglas cross-cutting

Estas reglas están desarrolladas en detalle (con ejemplos y el porqué) en
`mirroria-backend/AGENTS.md` — acá solo el resumen para quien recién llega al repo:

1. **Ningún módulo de negocio del backend importa entidades/servicios de otro módulo
   directamente.** Cuando haga falta referenciar un dato de otro dominio, se guarda como
   columna simple (uuid), no como relación ORM cruzando módulos.
2. **`core/` (backend) nunca depende de `modules/`.** Todo lo que sea específico de un
   dominio (ej. `JwtStrategy`, que necesita conocer `Usuario`) vive dentro de su módulo.
3. **`id` siempre `uuid` con default `gen_random_uuid()`** (pgcrypto), nunca
   `uuid_generate_v4()` (uuid-ossp, el default "automático" de TypeORM/JPA si no se fuerza lo
   contrario) — así quedó documentado y decidido en el diseño del vault.
4. **Catálogo exclusivamente de moda femenina:** no agregar campo/tabla de género en ningún
   punto del dominio de catálogo/productos.
5. **Errores de API con shape único:** `{ status, message, timestamp }` en cualquier endpoint
   que falle (ver `GlobalExceptionFilter` en el backend).

## ⚡ 6. Comandos rápidos

```bash
# Base de datos
docker compose up -d postgres-db

# Backend (puerto 3000, prefijo /api/v1, Swagger en /api/docs)
cd mirroria-backend && npm run start:dev

# Frontend (todavía no existe — próximo paso)
cd mirroria-frontend && npm run dev
```

## 🗺️ 7. Estado actual y próximos pasos (actualizado 2026-09-21)

- ✅ Postgres dockerizado y funcionando. **Las 23 tablas del diseño están completas** (antes de
  cerrar `pagos` eran 22 de 23).
- ✅ Backend NestJS: `core/` completo y los **10 módulos de negocio** implementados y verificados
  end-to-end contra Postgres real: `seguridad` (registro/login/perfil + gestión de
  usuarios/roles RF02), `proveedores`, `catalogo`, `sucursales`, `inventario`, `ventas`
  (digital + presencial), `reservas` (RF09-12), `promociones` (cupones porcentuales y monto
  fijo, validación pública, consumo transaccional en ventas con cálculo de descuento), `ia`
  (CU24, reportes dinámicos por lenguaje natural — el modelo nunca escribe SQL) y **`pagos`**
  (RF19, cerrado 2026-09-21: tarjeta por Stripe con webhook firmado como única autoridad sobre
  el cobro, más QR/efectivo confirmados a mano por un `CAJERO`/`ADMIN` — ver
  `mirroria-backend/AGENTS.md` para el detalle real, incluida la salvedad sobre el QR y el
  dinero real).
- ✅ `mirroria-frontend/` — e-commerce completo funcionando de punta a punta contra el backend
  real: inicio, tienda, ficha de producto, carrito, checkout (ahora con soporte de cupones de
  descuento y cálculo reactivo de ahorros), pago de la venta (tarjeta vía Stripe, o instrucciones
  de QR/efectivo con seguimiento de estado real, no afirmado por la ruta de regreso), `/reservas`
  del cliente, y panel de administración (`/admin/*`) con catálogo, proveedores, sucursales,
  inventario, ventas, reservas, usuarios/roles, promociones/cupones (`/admin/cupones`) y cobros
  manuales pendientes de confirmar, más una pantalla de reportes por IA (CU24) para staff con
  ficha interpretada, tabla, comparación y dictado por voz vía Web Speech API — esto último no
  se probó todavía en un navegador real. Stack visual 100% compuesto con shadcn/ui.
- 🚧 Frontend: falta una pantalla de punto de caja (POS) para el rol `CAJERO` (el endpoint del
  backend ya existe y está protegido por rol, pero no hay UI todavía) — no forma parte del
  alcance de `pagos`, es venta presencial (RF17-18).
- ✅ `mirroria-mobile/` (React Native + Expo SDK 57 + NativeWind v4 + React Native Reusables):
  scaffold base modular, diseño boutique con acento vino de marca, persistencia con
  `expo-secure-store`, feature `auth` (Login y Register) con validación Zod y React Hook Form
  integrada contra el backend NestJS real (`/seguridad/auth/*`).
- ⬜ Dockerizar backend/frontend en `docker-compose.yml` (por ahora solo corren en local
  apuntando al Postgres dockerizado) y despliegue en Azure.
