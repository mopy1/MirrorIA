---
tags:
  - si2
  - parcial2
  - mirroria
  - desarrollo
  - implementacion
  - c4
  - ddl_sql
  - capitulo4
date: 2026-11-07
---

# CAPÍTULO IV. DESARROLLO E IMPLEMENTACIÓN

---

## 4.1. Herramientas y Tecnologías Utilizadas

Para la evolución, modelado e implementación de la plataforma SaaS multi-tenant **MirrorIA**, se seleccionó un conjunto de tecnologías y herramientas alineadas con los principios de la metodología ICONIX, priorizando la separación en capas, el alto rendimiento asíncrono, el aislamiento lógico riguroso y la tolerancia a fallos mediante persistencia distribuida:

### 4.1.1. Tecnologías de Desarrollo de Software

* **Backend Central: NestJS 12 y TypeScript (ESM nativo)**
  * **TypeScript 6 & Node.js 24:** Lenguaje tipado que garantiza seguridad en tiempo de compilación y mantenibilidad corporativa. Se configuró en modo ECMAScript Modules puro (`"type": "module"`, `moduleResolution: "nodenext"`).
  * **NestJS 12:** Framework empresarial basado en arquitectura modular e inyección de dependencias. Permite la estructuración desacoplada en 14 módulos de negocio, aplicación de filtros de excepción homogéneos (`GlobalExceptionFilter`), validación declarativa de esquemas mediante `class-validator` / `ValidationPipe` y documentación interactiva automática con Swagger OpenAPI (`/api/docs`).
  * **TypeORM 1.x:** Mapeador objeto-relacional (ORM) encargado de la comunicación con PostgreSQL, aplicando la cláusula transversal `where: soloTenant({...})` y gestionando transacciones atómicas con bloqueos pesimistas (`pessimistic_write`).
* **Frontend Web (tienda de la clienta y panel del personal): React 19 (PWA)**
  * **React 19 & Vite:** Biblioteca declarativa de interfaces de usuario optimizada con compilador nativo y Vite como empaquetador ultrarrápido (puerto local `5174` en desarrollo, Nginx en puerto `80` para producción).
  * **Tailwind CSS v4 & shadcn/ui (Base UI):** Motor de diseño atómico sin dependencias obsoletas, utilizando el preset Nova sobre primitivas accesibles de Base UI y una iconografía uniforme al 100% en **Phosphor Icons** (`@phosphor-icons/react`).
  * **IndexedDB (`idb`):** Motor de base de datos no relacional transaccional embebido en el navegador, utilizado por la PWA para almacenar localmente el catálogo de prendas (almacén `catalogo_cache` con TTL de 7 días) y la cola de operaciones diferidas (almacén `outbox` FIFO).
  * **Service Worker (`sw.js`):** Script en segundo plano que gestiona la estrategia de caché *Cache-First* para el App Shell (`mirroria-app-shell-v1`) y *Network-First* con fallback a IndexedDB para el consumo de la API REST.
* **Persistencia Central: PostgreSQL 16 (`mirroria_db`)**
  * Motor relacional transaccional robusto ejecutándose en contenedor Docker (`mirroria_postgres`, puerto `5435`). Alberga las 30 tablas del sistema con extensiones criptográficas `pgcrypto` (`gen_random_uuid()`) y `uuid-ossp`. Garantiza el aislamiento multi-tenant mediante índices compuestos sobre `tenant_id` y transacciones con aislamiento ACID.
* **Microservicio de Machine Learning: Python 3.12 y FastAPI**
  * **FastAPI:** Microframework web asíncrono en Python que expone endpoints REST en puerto `8002` (contenedor `mirroria_ml`, 68 MB de RAM) para inferencia analítica en tiempo real.
  * **Scikit-Learn, Pandas y Joblib:** Bibliotecas estadísticas empleadas para entrenar de forma reproducible ($N=10.000$, semilla fija `seed=42`) los cuatro modelos: Random Forest (M1), Regresión Logística L2 (M2), K-Means (M3) e Isolation Forest (M4).
* **Movilidad y Persistencia Embebida: React Native / Expo SDK 58**
  * Cliente móvil nativo **solo para la clienta y el visitante** (vitrina, carrito, pagos, reservas con Pase de Tienda y compra desde reserva), con **SQLite** (`expo-sqlite`) como réplica espejo del catálogo e inventario y como cola de salida del checkout y las reservas, y `@react-native-community/netinfo` para la detección de conectividad. El personal de la tienda no usa la app móvil.
* **Servicios e Integraciones Externas:**
  * **Stripe Checkout:** Pasarela de pagos internacionales para tarjetas de crédito/débito con verificación de webhooks firmados (`Stripe-Signature`).
  * **Banco Simulado Wayra (QR):** Servicio financiero nacional que emite códigos QR dinámicos y callbacks firmados mediante HMAC-SHA256 con idempotencia por `event_id`.
  * **Decart AI (`lucy-vton-3.5`):** Motor generativo en la nube para el probador virtual en tiempo real consumido a través de tokens efímeros seguros de 5 minutos.
  * **DeepSeek LLM & DuckDB:** Modelo de lenguaje para extracción analítica de lenguaje natural y motor in-process DuckDB (`:memory:`) para simulaciones *What-If*.
  * **ExcelJS:** Motor de generación de libros de cálculo nativos en formato `.xlsx` con formato contable institucional `"Bs" #,##0.00`.

---

### 4.1.2. Herramientas de Modelado, Diseño y Productividad

* **Mermaid & Mermaid CLI (`@mermaid-js/mermaid-cli` v12.2.0):** Herramienta de diagramación declarativa como código utilizada para modelar los diagramas de clases, robustez BCE, secuencias UML 2.5 y diagramas C4, compilándolos de forma nativa a imágenes PNG de alta resolución.
* **Docker & Docker Compose:** Entorno de contenedores para orquestar la suite de servicios (`mirroria_postgres`, `mirroria_backend`, `mirroria_frontend` y `mirroria_ml`) con políticas `restart: "no"` para cuidar la memoria RAM en WSL3.
* **Vitest & Oxlint:** Suite de pruebas ultrarrápida (466 pruebas en backend y 293 en frontend) y linter de alto rendimiento.
* **Git & GitHub:** Control de versiones distribuido bajo estrategia de rama única `main` para trazabilidad de código.

---

## 4.2. Diseño de la Arquitectura del Sistema (Diagrama C4 Nivel 1: Contexto)

El siguiente diagrama de Contexto (C4 Nivel 1) modela las fronteras del sistema MirrorIA, sus usuarios y las interacciones con plataformas externas:

```mermaid
graph TB
    subgraph Usuarios["Actores del Ecosistema"]
        SUPER["SuperAdmin SaaS\n(Operador de MirrorIA)"]
        ADMIN["Dueño de Boutique\n(ADMIN Inquilino)"]
        STAFF["Personal de Tienda — solo web\n(Cajera / Encargado)"]
        CLIENTA["Clienta / Usuaria Final\n(Compradora Web/Móvil)"]
    end

    subgraph MirrorIA_System["Sistema Central MirrorIA (SaaS Multi-tenant)"]
        SYS["Plataforma MirrorIA\n(E-Commerce de Moda Femenina,\nProbador Virtual, Reservas y Analítica BI/ML)"]
    end

    subgraph Externos["Sistemas y Servicios Externos"]
        STRIPE["Pasarela Stripe\n(Cobro Tarjeta Internacional)"]
        WAYRA["Banco Wayra QR\n(Cobros Interoperables HMAC)"]
        DECART["Decart AI VTON\n(Motor Generativo de Video)"]
        DEEPSEEK["DeepSeek LLM API\n(Motor de Lenguaje Natural)"]
    end

    SUPER -->|Administra planes y supervisa inquilinos| SYS
    ADMIN -->|Personaliza marca y gestiona inventario| SYS
    STAFF -->|Confirma cobros en efectivo y atiende citas (web)| SYS
    CLIENTA -->|Prueba prendas con IA y compra online/offline| SYS

    SYS <-->|Sesiones alojadas y webhooks firmados| STRIPE
    SYS <-->|Emite QR dinámico y procesa avisos HMAC| WAYRA
    SYS -->|Genera tokens efímeros para probador| DECART
    SYS <-->|Extrae fichas analíticas en lenguaje natural| DEEPSEEK
```

---

## 4.3. Implementación de la Base de Datos Relacional (PostgreSQL 16)

A continuación se expone el script DDL SQL representativo de la base de datos compartida `mirroria_db`, reflejando la extensión `pgcrypto`, llaves primarias basadas en UUID, discriminador multi-tenant `tenant_id` e índices de integridad:

```sql
-- Extensión criptográfica para UUIDv4 nativo
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABLA: planes (Catálogo de suscripciones comerciales SaaS)
CREATE TABLE public.planes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL UNIQUE,
    nombre character varying(100) NOT NULL,
    precio_mensual_cents bigint NOT NULL,
    precio_mensual_usd_cents bigint NOT NULL,
    max_sucursales integer,
    max_productos integer,
    max_usuarios_staff integer,
    dias_prueba integer DEFAULT 14 NOT NULL,
    destacado boolean DEFAULT false NOT NULL,
    nivel_marca character varying(20) DEFAULT 'ESENCIAL' NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_planes PRIMARY KEY (id)
);

-- 2. TABLA: inquilinos (Empresas boutiques contratantes)
CREATE TABLE public.inquilinos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(80) NOT NULL UNIQUE,
    nombre_comercial character varying(150) NOT NULL,
    estado character varying(20) DEFAULT 'TRIAL' NOT NULL,
    trial_ends_at timestamp without time zone NOT NULL,
    plan_id uuid NOT NULL REFERENCES public.planes(id),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_inquilinos PRIMARY KEY (id)
);

-- 3. TABLA: suscripciones (Contratos B2B de inquilinos con planes)
CREATE TABLE public.suscripciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL UNIQUE REFERENCES public.inquilinos(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES public.planes(id),
    estado character varying(20) DEFAULT 'TRIAL' NOT NULL,
    fecha_inicio timestamp without time zone DEFAULT now() NOT NULL,
    fecha_vencimiento timestamp without time zone NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_suscripciones PRIMARY KEY (id)
);

-- 4. TABLA: inquilino_marca (Tokens de personalización visual con WCAG)
CREATE TABLE public.inquilino_marca (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL UNIQUE REFERENCES public.inquilinos(id) ON DELETE CASCADE,
    logotipo_url character varying(255),
    favicon_url character varying(255),
    color_principal character varying(7) DEFAULT '#281B89' NOT NULL,
    color_acento character varying(7) DEFAULT '#C3F74C' NOT NULL,
    modo character varying(10) DEFAULT 'CLARO' NOT NULL,
    tipografia character varying(30) DEFAULT 'outfit' NOT NULL,
    radio_borde character varying(10) DEFAULT 'md' NOT NULL,
    mostrar_insignia boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_inquilino_marca PRIMARY KEY (id)
);

-- 5. TABLA: ciudades (Catálogo global de capitales de Bolivia)
CREATE TABLE public.ciudades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL UNIQUE,
    codigo_iso character varying(10) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_ciudades PRIMARY KEY (id)
);

-- 6. TABLA: sucursales (Puntos de venta físicos por boutique)
CREATE TABLE public.sucursales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    ciudad_id uuid NOT NULL REFERENCES public.ciudades(id),
    nombre character varying(150) NOT NULL,
    direccion character varying(255) NOT NULL,
    es_matriz boolean DEFAULT false NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_sucursales PRIMARY KEY (id)
);
CREATE INDEX idx_sucursales_tenant ON public.sucursales(tenant_id);

-- 7. TABLA: usuarios (Cuentas con aislamiento multitenant y RBAC)
CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid, -- NULL exclusivamente para DUENO_PLATAFORMA
    sucursal_id uuid REFERENCES public.sucursales(id),
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nombre character varying(100) NOT NULL,
    rol character varying(30) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uk_usuarios_tenant_email UNIQUE (tenant_id, email)
);
CREATE INDEX idx_usuarios_tenant ON public.usuarios(tenant_id);

-- 8. TABLA: proveedores (Talleres de confección textil)
CREATE TABLE public.proveedores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    razon_social character varying(150) NOT NULL,
    nit character varying(30),
    contacto character varying(100),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_proveedores PRIMARY KEY (id)
);
CREATE INDEX idx_proveedores_tenant ON public.proveedores(tenant_id);

-- 9. TABLA: categorias (Taxonomía de indumentaria femenina)
CREATE TABLE public.categorias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_categorias PRIMARY KEY (id),
    CONSTRAINT uk_categorias_tenant_slug UNIQUE (tenant_id, slug)
);
CREATE INDEX idx_categorias_tenant ON public.categorias(tenant_id);

-- 10. TABLA: productos (Prendas maestras)
CREATE TABLE public.productos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    categoria_id uuid NOT NULL REFERENCES public.categorias(id),
    proveedor_id uuid REFERENCES public.proveedores(id),
    titulo character varying(200) NOT NULL,
    descripcion text,
    precio_cents bigint NOT NULL,
    imagenes jsonb DEFAULT '[]'::jsonb NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_productos PRIMARY KEY (id)
);
CREATE INDEX idx_productos_tenant ON public.productos(tenant_id);

-- 11. TABLA: variantes_producto (Matriz SKU por talla y color)
CREATE TABLE public.variantes_producto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    sku character varying(100) NOT NULL,
    talla character varying(20) NOT NULL,
    color_hex character varying(7) NOT NULL,
    color_nombre character varying(50) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_variantes PRIMARY KEY (id),
    CONSTRAINT uk_variantes_tenant_sku UNIQUE (tenant_id, sku)
);
CREATE INDEX idx_variantes_tenant ON public.variantes_producto(tenant_id);

-- 12. TABLA: inventario_sucursal (Control de existencias físicas)
CREATE TABLE public.inventario_sucursal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    sucursal_id uuid NOT NULL REFERENCES public.sucursales(id),
    variante_id uuid NOT NULL REFERENCES public.variantes_producto(id),
    cantidad_disponible integer DEFAULT 0 NOT NULL,
    cantidad_reservada integer DEFAULT 0 NOT NULL,
    cantidad_transito integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_inventario PRIMARY KEY (id),
    CONSTRAINT uk_inventario_sucursal_variante UNIQUE (tenant_id, sucursal_id, variante_id),
    CONSTRAINT chk_disponible_no_negativo CHECK (cantidad_disponible >= 0),
    CONSTRAINT chk_reservada_no_negativo CHECK (cantidad_reservada >= 0)
);
CREATE INDEX idx_inventario_tenant ON public.inventario_sucursal(tenant_id);

-- 13. TABLA: movimientos_inventario (Kardex inmutable)
CREATE TABLE public.movimientos_inventario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    inventario_id uuid NOT NULL REFERENCES public.inventario_sucursal(id),
    tipo character varying(30) NOT NULL, -- VENTA, RESERVA, RECEPCION, AJUSTE
    cantidad integer NOT NULL,
    saldo_anterior integer NOT NULL,
    saldo_nuevo integer NOT NULL,
    motivo character varying(255),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_movimientos PRIMARY KEY (id)
);
CREATE INDEX idx_movimientos_tenant ON public.movimientos_inventario(tenant_id);

-- 14. TABLA: ordenes_compra (Abastecimiento textil a talleres)
CREATE TABLE public.ordenes_compra (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    proveedor_id uuid NOT NULL REFERENCES public.proveedores(id),
    sucursal_destino_id uuid NOT NULL REFERENCES public.sucursales(id),
    usuario_id uuid NOT NULL REFERENCES public.usuarios(id),
    estado character varying(30) DEFAULT 'PENDIENTE' NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    fecha_pedido timestamp without time zone DEFAULT now() NOT NULL,
    fecha_recepcion timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_ordenes_compra PRIMARY KEY (id)
);
CREATE INDEX idx_ordenes_tenant ON public.ordenes_compra(tenant_id);

-- 15. TABLA: carritos (Bolsa de compras digital persistente)
CREATE TABLE public.carritos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    usuario_id uuid NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_carritos PRIMARY KEY (id)
);
CREATE INDEX idx_carritos_tenant ON public.carritos(tenant_id);

-- 16. TABLA: ventas (Compras de la clienta: Web, Móvil y compra desde reserva)
CREATE TABLE public.ventas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    sucursal_id uuid NOT NULL REFERENCES public.sucursales(id),
    cliente_id uuid REFERENCES public.usuarios(id),
    cajero_id uuid REFERENCES public.usuarios(id),
    reserva_id uuid,
    cupon_id uuid,
    canal character varying(20) NOT NULL, -- WEB o MOVIL
    estado character varying(30) DEFAULT 'PENDIENTE' NOT NULL, -- PENDIENTE, PAGADA, CANCELADA
    numero_comprobante character varying(50),
    subtotal_cents bigint NOT NULL,
    descuento_cents bigint DEFAULT 0 NOT NULL,
    total_cents bigint NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_ventas PRIMARY KEY (id)
);
CREATE INDEX idx_ventas_tenant ON public.ventas(tenant_id);

-- 17. TABLA: venta_items (Líneas de detalle de venta)
CREATE TABLE public.venta_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    venta_id uuid NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
    variante_id uuid NOT NULL REFERENCES public.variantes_producto(id),
    cantidad integer NOT NULL,
    precio_unitario_cents bigint NOT NULL,
    subtotal_cents bigint NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_venta_items PRIMARY KEY (id)
);
CREATE INDEX idx_venta_items_tenant ON public.venta_items(tenant_id);

-- 18. TABLA: reservas (Citas de prueba física en tienda)
CREATE TABLE public.reservas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    sucursal_id uuid NOT NULL REFERENCES public.sucursales(id),
    cliente_id uuid NOT NULL REFERENCES public.usuarios(id),
    fecha_hora_cita timestamp without time zone NOT NULL,
    estado character varying(30) DEFAULT 'PENDIENTE' NOT NULL, -- PENDIENTE, CONFIRMADA, EN_TIENDA, COMPLETADA, EXPIRADA, NO_SHOW, CANCELADA
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_reservas PRIMARY KEY (id)
);
CREATE INDEX idx_reservas_tenant ON public.reservas(tenant_id);

-- 19. TABLA: reserva_items (Prendas retenidas en probador)
CREATE TABLE public.reserva_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
    variante_id uuid NOT NULL REFERENCES public.variantes_producto(id),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_reserva_items PRIMARY KEY (id)
);
CREATE INDEX idx_reserva_items_tenant ON public.reserva_items(tenant_id);

-- 20. TABLA: pagos (Registro de cobros con pasarelas)
CREATE TABLE public.pagos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    venta_id uuid NOT NULL REFERENCES public.ventas(id),
    proveedor_pago character varying(30) NOT NULL, -- STRIPE, WAYRA, MANUAL
    metodo character varying(30) NOT NULL, -- TARJETA, QR, EFECTIVO
    monto_cents bigint NOT NULL,
    estado character varying(30) DEFAULT 'PENDIENTE' NOT NULL, -- PENDIENTE, APROBADO, RECHAZADO, REEMBOLSADO
    monto_reembolsado_cents bigint DEFAULT 0 NOT NULL,
    event_id character varying(150) NOT NULL UNIQUE,
    referencia_externa character varying(150),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_pagos PRIMARY KEY (id)
);
CREATE INDEX idx_pagos_tenant ON public.pagos(tenant_id);

-- 21. TABLA: idempotencia (Garantía transaccional offline)
CREATE TABLE public.idempotencia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    clave character varying(150) NOT NULL,
    hash_cuerpo character varying(64) NOT NULL,
    ruta character varying(255) NOT NULL,
    metodo character varying(10) NOT NULL,
    estado character varying(20) DEFAULT 'EN_PROCESO' NOT NULL, -- EN_PROCESO, COMPLETADO, FALLIDO
    codigo_estado integer,
    cuerpo_respuesta jsonb,
    expira_en timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_idempotencia PRIMARY KEY (id),
    CONSTRAINT uk_idempotencia_tenant_clave UNIQUE (tenant_id, clave)
);
CREATE INDEX idx_idempotencia_tenant ON public.idempotencia(tenant_id);

-- 22. TABLA: cobros_suscripcion (Cobranzas B2B de planes SaaS)
CREATE TABLE public.cobros_suscripcion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    plan_id uuid NOT NULL REFERENCES public.planes(id),
    proveedor_pago character varying(30) NOT NULL,
    monto_cents bigint NOT NULL,
    estado character varying(30) DEFAULT 'PENDIENTE' NOT NULL,
    event_id character varying(150) NOT NULL UNIQUE,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_cobros_suscripcion PRIMARY KEY (id)
);

-- 23. TABLA: cupones (Descuentos y fidelización)
CREATE TABLE public.cupones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    codigo character varying(50) NOT NULL,
    tipo character varying(20) NOT NULL, -- PORCENTAJE o MONTO_FIJO
    valor integer NOT NULL,
    monto_minimo_cents bigint DEFAULT 0 NOT NULL,
    usos_maximos integer DEFAULT 100 NOT NULL,
    usos_actuales integer DEFAULT 0 NOT NULL,
    valido_desde timestamp without time zone NOT NULL,
    valido_hasta timestamp without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_cupones PRIMARY KEY (id),
    CONSTRAINT uk_cupones_tenant_codigo UNIQUE (tenant_id, codigo)
);

-- 24 a 30: Tablas de soporte (temporadas, colecciones, tallas, colores, refresh_tokens, interacciones_ia, eventos_plataforma)
-- Mantienen id UUID, createdAt, updatedAt y tenant_id según corresponda.
```

---

## 4.4. Desarrollo de los Módulos del Sistema

La implementación del sistema se organiza de forma estricta en torno a los **cinco módulos funcionales rectores**:

### 4.4.1. Módulo de Gestión Multitenant y Suscripciones (SaaS)
* **Lógica Backend:** Implementado en `SaasModule`. Administra las tablas `planes`, `inquilinos`, `suscripciones`, `inquilino_marca` y `cobros_suscripcion`. El servicio `AprovisionadorWorkspaceService` orquesta la transacción atómica de alta de boutique sembrando la base relacional en PostgreSQL. El método `assertDentroDelPlan` valida en tiempo de ejecución las cuotas máximas de sucursales, productos y staff.
* **Lógica Frontend:** Vistas `/plataforma/*` para el superusuario y `/admin/suscripcion` para el cliente del SaaS, con la vista `/admin/apariencia` que implementa la validación algorítmica de contraste accesible WCAG 2.1 en espacio cromático OKLCH.

### 4.4.2. Módulo de Catálogo, Inventario y Cobros
* **Lógica Backend:** Implementado mediante los módulos desacoplados `catalogo`, `inventario`, `proveedores` y `ventas`. Administra existencias físicas mediante el servicio `InventarioSucursalService`, asegurando que `ajustarStock` sea el único punto que toque `cantidad_disponible` con sentencias SQL `UPDATE` condicionadas.
* **Lógica Frontend:** Consola de Caja en `/admin/dashboard` y `/admin/cobros` para la Cajera (solo web), con lectura rápida de existencias y confirmación de cobros en efectivo de las compras de las clientas. El sistema no tiene punto de venta: el personal no registra ventas; los comprobantes `C-XXXXXXXX` se emiten de forma determinista para cada compra.

### 4.4.3. Módulo de Experiencia del Cliente y Probador Virtual por IA
* **Lógica Backend:** Módulos `probador`, `reservas` y `promociones`. El módulo `probador` actúa como gateway hacia el motor generativo Decart (`lucy-vton-3.5`), expidiendo tokens de acceso efímeros de 5 minutos con limitador de tasa por IP. El servicio `ReservasService` implementa la máquina de estados finitos (`PENDIENTE` $\to$ `CONFIRMADA` $\to$ `EN_TIENDA` $\to$ `COMPLETADA`) y la suspensión de 30 días ante 2 faltas consecutivas. La reserva se cierra con la compra desde reserva ("Comprar lo que reservé"): una venta `PENDIENTE` ligada a la reserva que la pasa a `COMPLETADA` al aprobarse el pago.
* **Lógica Frontend:** Vitrina pública `/t/:slug` con inyección dinámica de variables CSS de marca, ficha técnica de prenda con selector SKU e interfaz interactiva del Probador Virtual VTON en `/t/:slug/probador`. La app móvil (Expo) replica la experiencia de la clienta con pestañas Vitrina · Probador · Carrito · Mis cosas.

### 4.4.4. Módulo de Operación Offline-First y Sincronización
* **Lógica Cliente:** El archivo `public/sw.js` cachea el App Shell en `mirroria-app-shell-v1`. El módulo `src/lib/offline/idb.ts` estructura los almacenes IndexedDB `catalogo_cache` (TTL 7 días) y `outbox` FIFO. La clase `OutboxManager` detecta eventos de reconexión y drena la cola enviando la cabecera `Idempotency-Key` (SHA-256). La PWA encola el checkout y las reservas de la clienta con `encolarOperacion`; la app móvil hace lo mismo sobre SQLite (`outbox_local`). Ante rechazos 409 por stock agotado, transiciona a `COMPENSADA` y abre `ModalConflictoStock`.
* **Lógica Servidor:** El interceptor `IdempotenciaInterceptor` extrae la llave UUIDv4 y el hash canónico del body, consultando la tabla `idempotencia`. Si la orden ya fue procesada, responde con `X-Cache-Idempotency: HIT`.

### 4.4.5. Módulo de Reportes Generativos con IA y Machine Learning
* **Lógica Backend:** Módulo `ia` con DeepSeek LLM y catálogo de 23 métricas parametrizadas (sin sentencias SQL arbitrarias generadas por IA) y motor in-process DuckDB (`:memory:`) para simulaciones *What-If*. Módulo `bi` con endpoints analíticos directos `/dashboard/ejecutivo` y `/dashboard/operativo`. Módulo `ml` que actúa como proxy hacia el microservicio Python en puerto `8002` con fallback heurístico resiliente (`X-ML-Fallback: true`).
* **Lógica Microservicio ML (`mirroria-ml`):** Proceso en FastAPI con 4 modelos entrenados reproducibles ($N=10.000$, `seed=42`): Demanda a 30 días (Random Forest, $R^2 = 0.9566$), Riesgo No-Show (Regresión Logística L2, ROC-AUC 0.7978), Segmentación RFM (K-Means, Silueta 0.6823) y Auditoría de caja y cobros (Isolation Forest, c=0.03).
* **Lógica Frontend:** Tableros `/admin/dashboard` y `/admin/ml` en lenguaje directivo con gráficos Recharts y modal lateral de rigor científico formal `FichaTecnicaSheet`.

---

## 4.5. Integración de Componentes

La comunicación y cohesión entre los diferentes subsistemas se rige por contratos estrictos:
1. **Frontend $\leftrightarrow$ Backend Central (NestJS):** Comunicación REST JSON sobre HTTP/S en `/api/v1/*`. Las peticiones inyectan obligatoriamente el contexto mediante la cabecera `X-Tenant: <slug>` o el token Bearer JWT con el `tenantId` verificado contra la base de datos.
2. **Backend NestJS $\leftrightarrow$ Microservicio Python ML:** Llamadas HTTP internas síncronas hacia `http://mirroria-ml:8002/predict/*` con un tiempo de espera límite estricto (*timeout*) de **3.000 ms** gestionado mediante `AbortController`. Ante caídas o sobrecargas, el interceptor conmuta de forma transparente al cálculo heurístico matemático de respaldo.
3. **Backend NestJS $\leftrightarrow$ Pasarelas de Pago:**
   - **Stripe:** Creación de sesiones alojadas mediante el SDK oficial y recepción de webhooks en `POST /api/v1/pagos/webhook` con validación obligatoria de la firma criptográfica `Stripe-Signature`.
   - **Banco Wayra:** Generación de códigos QR con payload estructurado y recepción de avisos bancarios en `POST /api/v1/pagos/qr/aviso` con verificación estricta de firma **HMAC-SHA256** mediante `crypto.timingSafeEqual`.
4. **Cliente Web $\leftrightarrow$ Persistencia Local y Outbox:** Sincronización asíncrona no bloqueante coordinada entre el hilo principal de React 19 y el Service Worker mediante eventos globales de ventana (`mirroria:conflicto-stock`).
