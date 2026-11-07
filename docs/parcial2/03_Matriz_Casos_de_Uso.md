---
tags:
  - si2
  - parcial2
  - mirroria
  - casos_de_uso
  - iconix
  - uml
  - examen_si2
  - mobile
  - omnicanal
date: 2026-11-06
---

# 📋 03. Matriz Consolidada de Casos de Uso — MirrorIA (17 CUs Omnicanal)

> [!IMPORTANT] 🎯 Principio de Omnicanalidad en ICONIX (Web + Móvil)
> En la metodología **ICONIX**, un Caso de Uso modela la **intención de negocio del usuario** (ej. comprar prendas, reservar probador, sincronizar transacciones offline), la cual es independiente del dispositivo.
> - **Fronteras Duales (Boundary):** Cada caso de uso del cliente o de mostrador cuenta con dos objetos de frontera: `<<Boundary>> PantallaWeb...` (React 19 / PWA) y `<<Boundary>> PantallaMovil...` (React Native / Expo).
> - **Control y Entidad Únicos:** Ambos canales consumen los mismos controladores en NestJS (`<<Control>>`) y operan sobre las mismas entidades de PostgreSQL (`<<Entity>>`).
> - **Persistencia Offline Diferencial:** La Web persiste en **IndexedDB**, mientras que el Móvil persiste en su base de datos local embebida **SQLite** (`expo-sqlite`). Ambos sincronizan mediante la misma cabecera `Idempotency-Key`.

---

## 🗺️ 1. Modelo de Frontera Dual en Robustez (BCE Omnicanal)

```mermaid
flowchart LR
    subgraph Fronteras_Dual_Boundary["Fronteras del Sistema (Boundary)"]
        BW["<<Boundary>>\nPantallaWeb (PWA)\nPersistencia: IndexedDB"]
        BM["<<Boundary>>\nPantallaMovil (Expo)\nPersistencia: SQLite"]
    end

    subgraph Logica_Control["Controladores de Negocio (Control)"]
        CTL["<<Control>>\nControlador de Negocio\n(NestJS :3000 / Tenancy / Idempotencia)"]
    end

    subgraph Entidades_Datos["Entidades de Dominio (Entity)"]
        ENT[("<<Entity>>\nPostgreSQL 16 (:5435)\n(Aislamiento tenant_id)")]
    end

    BW -->|HTTP REST / X-Tenant| CTL
    BM -->|HTTP REST / X-Tenant| CTL
    CTL --> ENT
```

---

## 📋 2. Matriz Maestra de Casos de Uso (17 CUs Omnicanal)

| # | Área de Examen | CU | Nombre del Caso de Uso | Canal / Frontera | Actores Primarios y Secundarios | Pantalla / Ruta UI | Endpoints Backend | Operaciones Agrupadas y Punto Fuerte de Examen |
|---|---|---|---|---|---|---|---|---|
| **01** | **SaaS Multi-tenant** | **CU01** | Aprovisionar Tienda y Workspace SaaS | **Web** | • **Visitante / Dueño**<br>• Stripe / Wayra | `/planes`<br>`/registro-tienda` | `POST /saas/tiendas`<br>`GET /saas/tiendas/disponibilidad` | **Aprovisionamiento atómico:** Selección de plan, registro de boutique, creación de BD con `tenant_id`, sucursal física matriz, usuario `ADMIN`, proveedor y catálogo demo en una sola transacción. Período `TRIAL` (14 días). |
| **02** | **SaaS Multi-tenant** | **CU02** | Administrar Suscripciones, Planes y Moderación | **Web** | • **Superadmin** (`DUENO_PLATAFORMA`)<br>• **Dueño Tienda** (`ADMIN`) | `/plataforma/*`<br>`/admin/suscripcion` | `GET/PATCH /saas/plataforma/*`<br>`GET/POST /saas/mi-suscripcion/*` | **Gobierno B2B:** Superadmin parametriza límites de planes (sucursales, prendas, staff), monitorea métricas SaaS (MRR, Churn, GMV) y suspende tiendas. Dueño consulta cuotas (`UsoPlanService`) y paga/renueva suscripción. |
| **03** | **Personalización** | **CU03** | Personalizar Identidad Visual de Boutique | **Web** | • **Dueño Tienda** (`ADMIN`)<br>• Superadmin (de oficio) | `/admin/apariencia`<br>`/plataforma/inquilinos/:id` | `GET/PUT /saas/mi-marca`<br>`POST /mi-marca/restablecer` | **Theming dinámico y accesibilidad:** Configuración de logo, tipografías, banners y colores de marca con validación matemática obligatoria de contraste **WCAG 2.1** (ratio $\ge 4.5:1$). Restablecimiento a paleta sugerida. |
| **04** | **Catálogo Maestro** | **CU04** | Gestionar Catálogo Maestro y Variantes SKU | **Web** | • **Dueño Tienda** (`ADMIN`) | `/admin/catalogo/*` | `CRUD /catalogo/productos`<br>`CRUD /variantes`, `/categorias` | **Taxonomía exclusiva femenina:** Categorías, temporadas, colecciones, tallas y colores HEX. Publicación de prendas maestras con imágenes `jsonb` y variantes SKU con precio en centavos, respetando el límite del plan. |
| **05** | **Logística & Red** | **CU05** | Gestionar Inventario, Sucursales y Abastecimiento | **Web / Móvil** (Supervisor) | • **Dueño Tienda** (`ADMIN`)<br>• **Encargado** (`ENCARGADO_SUCURSAL`) | `/admin/inventario`<br>`/admin/sucursales`<br>`/admin/proveedores` | `CRUD /sucursales`<br>`POST /inventario/ordenes-compra`<br>`POST /inventario/recepciones`<br>`POST /inventario/ajuste` | **Control físico y kardex:** Red de tiendas por ciudad, asignación de personal, órdenes de compra a confeccionistas, recepción parcial/total en tienda incrementando stock libre (`UPDATE` condicionado) y kardex inmutable. |
| **06** | **Experiencia Retail** | **CU06** | Explorar Vitrina y Probar Prendas con IA (VTON) | **Omnicanal**<br>(Web PWA & App Móvil) | • **Clienta** (`CUSTOMER`)<br>• Visitante<br>• Decart AI Engine | `/t/:slug`<br>`/t/:slug/tienda`<br>`/t/:slug/probador/:id` | `GET /catalogo/productos`<br>`GET /inventario/.../disponibilidad`<br>`POST /probador/token` | **Probador virtual generativo:** Vitrina adaptada a la marca de la tienda, desglose de stock por sucursal e integración con Decart AI (`lucy-vton-3.5`) mediante token efímero de 5 min (10 peticiones/10 min por IP). |
| **07** | **Ventas & Checkout** | **CU07** | Gestionar Carrito y Procesar Checkout Digital | **Omnicanal**<br>(Web PWA & App Móvil) | • **Clienta** (`CUSTOMER`) | `/t/:slug/carrito`<br>`/t/:slug/checkout`<br>`/t/:slug/mis-pedidos` | `GET/POST /ventas/carrito`<br>`POST /promociones/cupones/validar`<br>`POST /ventas/checkout`<br>`GET /ventas/mias` | **Conversión omnicanal:** Carrito persistente (`jsonb` / SQLite local), validación de cupones, descuento atómico de stock y creación de venta en estado `PENDIENTE` (máx 2 compras pendientes por usuaria). |
| **08** | **Pasarelas Enchufables** | **CU08** | Procesar Cobros con Pasarelas Enchufables | **Omnicanal**<br>(Web PWA & App Móvil) | • **Clienta** (`CUSTOMER`)<br>• **Cajero** (`CAJERO`)<br>• Stripe / Wayra QR | `/t/:slug/pago/:id`<br>`/wayra/pagar/:token`<br>`/admin/cobros` | `POST /pagos/ventas/:id/sesion`<br>`POST /pagos/ventas/:id/qr`<br>`POST /pagos/:id/confirmar`<br>`POST /pagos/webhook`, `/aviso` | **Arquitectura desacoplada:** Registro central `RegistroPasarelasService` (`IPasarelaProveedor`), Stripe con sesión alojada y webhook firmado, Wayra QR con HMAC-SHA256, confirmación manual en efectivo y barrida de impagas. |
| **09** | **Probador Físico** | **CU09** | Gestionar Reservas para Probador Físico | **Omnicanal**<br>(Web PWA & App Móvil) | • **Clienta** (`CUSTOMER`)<br>• **Encargado / Cajero** | `/t/:slug/reservas`<br>`/admin/reservas`<br>`/admin/dashboard` | `POST /reservas`<br>`PATCH /reservas/:id/estado`<br>`POST /ventas/presenciales` | **Flujo anti-acaparamiento:** Apartado de hasta 3 prendas (máx 2 citas), bloqueo en `cantidad_reservada` (hasta 50% de stock libre), máquina de estados (`EN_TIENDA` en 1 clic en caja) y bloqueo de 30 días ante 2 inasistencias (`NO_SHOW`). |
| **10** | **Offline & Resiliencia** | **CU10** | Operar en Modo Desconectado con Sincronización Segura | **Omnicanal**<br>(Web PWA & App Móvil) | • **Clienta / Cajero**<br>• Service Worker / SQLite | `/t/:slug` (PWA / Móvil)<br>`/admin/dashboard` | *Service Worker + IndexedDB*<br>*NetInfo + SQLite Local*<br>Interceptor `Idempotency-Key` | **Punto de examen:**<br>• **Web:** Almacena en `IndexedDB` (7d TTL) y encola en Outbox FIFO.<br>• **Móvil:** Almacena en espejo local `SQLite` y encola en Outbox FIFO.<br>• **Ambos:** Al reconectar, envían la misma cabecera `Idempotency-Key` (SHA-256) garantizando cero duplicados. |
| **11** | **Concurrencia Crítica** | **CU11** | Resolver Conflicto de Concurrencia de Stock (`stock = 1`) | **Omnicanal**<br>(Web PWA & App Móvil) | • **Clienta / Cajero**<br>• API Backend | `ModalConflictoStock`<br>(Web y Nativo Móvil) | `POST /ventas/checkout`<br>(Respuesta HTTP 409 tipada) | **Pregunta clave de examen:** El servidor es autoridad única ante colisión offline por la última prenda. Si falla el UPDATE condicionado, devuelve 409 `STOCK_AGOTADO_CONFLICTO`; tanto la PWA como la App Móvil ejecutan **transacción compensatoria** (rollback local en outbox) y sugieren sustitutos guiados. |
| **12** | **Business Intelligence** | **CU12** | Monitorear Consola Ejecutiva de Negocio (ADMIN) | **Web / Tablet** | • **Dueño Tienda** (`ADMIN`)<br>• Encargado | `/admin/dashboard`<br>(Consola Ejecutiva) | `GET /dashboard/ejecutivo` | **Toma de decisiones directivas:** Facturación neta con deltas simétricos, ticket promedio, rotación de percha (`ventas / stock`), conversión probador $\to$ venta, pasarelas, top prendas inmunes a fan-out y cuotas del plan. |
| **13** | **Business Intelligence** | **CU13** | Operar Consola de Mostrador POS del Día (Cajero) | **Omnicanal**<br>(Web POS & Móvil POS) | • **Cajero** (`CAJERO`)<br>• Encargado | `/admin/dashboard`<br>(Consola Operativa) | `GET /dashboard/operativo` | **Agilidad táctica en mostrador:** Ventas en efectivo del turno con corte en `America/La_Paz`, alertas de stock crítico ($\le 2$ u.) o agotado, y agenda de citas del día con recepción en tienda en un solo clic. |
| **14** | **Analítica Avanzada** | **CU14** | Consultar Analítica en Lenguaje Natural e Híbrido con IA | **Web** | • **Dueño Tienda** (`ADMIN`)<br>• Encargado<br>• DeepSeek LLM | `/admin/reportes`<br>(Chat Inteligente) | `POST /ia/reportes`<br>`POST /ia/reportes/hibrido` | **IA segura y explicable:** El LLM mapea preguntas abiertas (texto/voz) a un catálogo de 23 métricas parametrizadas (nunca escribe SQL directo), corre simulaciones *What-If* en DuckDB in-process (`:memory:`) y narra conclusiones gerenciales. |
| **15** | **Analítica Avanzada** | **CU15** | Construir Reportes Dinámicos y Exportar a Excel | **Web** | • **Dueño Tienda** (`ADMIN`)<br>• Encargado | `/admin/reportes`<br>(Lienzo & Constructor) | `POST /ia/reportes/consulta`<br>`POST /ia/reportes/exportar-excel` | **Reportería interactiva corporativa:** Constructor visual de consultas sin coste de tokens de LLM, repivoteo en vivo por dimensiones cruzadas y generación nativa de libros contables `.xlsx` (`exceljs`) con formato `"Bs" #,##0.00` y fórmulas GAAP. |
| **16** | **Machine Learning** | **CU16** | Predecir Demanda de Inventario y Riesgo de Citas (Modelos Supervisados) | **Web / Móvil** | • **Dueño Tienda** (`ADMIN`)<br>• Encargado / Cajero<br>• Microservicio ML | `/admin/ml` (Demanda)<br>`/admin/dashboard` (POS) | `GET /ml/kpis/demanda`<br>`GET /ml/kpis/no-show` | **Inferencia supervisada (:8002):**<br>• **M1:** `RandomForestRegressor` ($R^2 = 0.9566$, MAE 1.91) para demanda a 30 días $\to$ previene quiebres de stock.<br>• **M2:** `LogisticRegression` L2 (ROC-AUC 0.7978, $F_1 = 0.7440$) para probabilidad de No-Show $\to$ semáforo de asistencia en citas. |
| **17** | **Machine Learning** | **CU17** | Auditar Anomalías POS y Segmentar Clientes (Modelos No Supervisados) | **Web** | • **Dueño Tienda** (`ADMIN`)<br>• Microservicio ML | `/admin/ml` (Clientas)<br>`/admin/ml` (Caja POS)<br>Modal Metodología | `GET /ml/kpis/rfm`<br>`GET /ml/kpis/anomalias`<br>`GET /ml/modelos/metricas` | **Inferencia no supervisada (:8002):**<br>• **M3:** `KMeans` ($K=4$, Silueta 0.6823) sobre variables RFM $\to$ fidelización de clientas.<br>• **M4:** `IsolationForest` (contaminación 0.03) $\to$ detección de fraudes y descuadres en caja POS.<br>• Ficha formal con dataset sintético reproducible ($N=10.000$, `seed=42`). |

---

## 🎯 3. Justificación Académica para la Defensa (Preguntas Típicas de Examen)

1. **¿Por qué un enfoque Omnicanal (Web + Móvil) en lugar de crear CUs separados?**
   En metodología ICONIX, el caso de uso captura la meta esencial del usuario (*Essential Use Case*). Comprar, apartar una reserva o pagar son la misma meta de negocio; duplicarlos solo porque la UI cambia de React a React Native generaría redundancia estéril en diagramas de robustez y secuencia.
2. **¿Dónde se refleja el soporte Móvil en ICONIX?**
   - En el **Diagrama de Robustez (BCE):** Mediante dos objetos *Boundary* (`PantallaWeb` y `PantallaMovil`) conectados al mismo objeto *Control* (API NestJS) y las mismas *Entity* (PostgreSQL).
   - En los **Mecanismos de Persistencia Offline:** En Web se utiliza `IndexedDB` coordinado por el Service Worker; en Móvil se utiliza base de datos local embebida `SQLite` (`expo-sqlite`).
3. **¿Cómo se resuelve la colisión offline `stock = 1` entre Web y Móvil?**
   Si una clienta en la app móvil y otra en la web compran la última unidad estando sin conexión, al reconectar ambas envían su orden con `Idempotency-Key`. El backend ejecuta un `UPDATE` condicionado atómico; la primera transacción descuenta el stock y la segunda recibe `HTTP 409 STOCK_AGOTADO_CONFLICTO`. Tanto la PWA como la App Móvil activan automáticamente una **transacción compensatoria** (rollback local en outbox) y despliegan el modal interactivo con opciones guiadas de sustitución.
