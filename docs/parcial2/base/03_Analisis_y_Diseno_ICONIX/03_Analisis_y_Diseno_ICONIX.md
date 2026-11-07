---
tags:
  - si2
  - parcial2
  - mirroria
  - iconix
  - diseno
  - robustez
  - secuencia
  - capitulo3
date: 2026-11-06
---

# CAPÍTULO III. ANÁLISIS Y DISEÑO CON ICONIX

---

## 3.1. Modelo de Dominio

El **Modelo de Dominio** constituye el vocabulario visual y conceptual del sistema MirrorIA, capturando las entidades fundamentales del negocio de moda femenina bajo la arquitectura SaaS Multi-tenant. Para garantizar el aislamiento lógico de datos entre boutiques, todas las entidades transaccionales y de configuración operativa incorporan el discriminador `tenantId: UUID` como llave foránea hacia la entidad central `Inquilino`.

![Figura 3.1: Modelo de Dominio de MirrorIA (UML 2.5)](../diagramas_png/fig3_1_modelo_dominio.png)

```mermaid
classDiagram
    direction TB

    class Plan {
        +UUID id PK
        +String codigo
        +String nombre
        +BigInt precioMensualCents
        +Int maxSucursales
        +Int maxProductos
        +Int maxUsuariosStaff
        +String nivelMarca
    }

    class Inquilino {
        +UUID id PK
        +String slug UK
        +String nombreComercial
        +String estado
        +DateTime trialEndsAt
    }

    class Suscripcion {
        +UUID id PK
        +UUID inquilinoId FK
        +UUID planId FK
        +String estado
        +DateTime fechaVencimiento
    }

    class InquilinoMarca {
        +UUID id PK
        +UUID inquilinoId FK
        +String colorPrincipal
        +String colorAcento
        +String modo
        +String tipografia
        +String logotipoUrl
        +Boolean mostrarInsignia
    }

    class Usuario {
        +UUID id PK
        +UUID tenantId FK
        +UUID sucursalId FK
        +String email
        +String passwordHash
        +String rol
        +Boolean activo
    }

    class Ciudad {
        +UUID id PK
        +String nombre
        +String codigoIso
    }

    class Sucursal {
        +UUID id PK
        +UUID tenantId FK
        +UUID ciudadId FK
        +String nombre
        +String direccion
        +Boolean esMatriz
    }

    class Proveedor {
        +UUID id PK
        +UUID tenantId FK
        +String razonSocial
        +String nit
        +String contacto
    }

    class Categoria {
        +UUID id PK
        +UUID tenantId FK
        +String nombre
        +String slug
    }

    class Producto {
        +UUID id PK
        +UUID tenantId FK
        +UUID categoriaId FK
        +UUID proveedorId FK
        +String titulo
        +BigInt precioCents
        +Json imagenes
        +Boolean activo
    }

    class VarianteProducto {
        +UUID id PK
        +UUID tenantId FK
        +UUID productoId FK
        +String sku UK
        +String talla
        +String colorHex
    }

    class InventarioSucursal {
        +UUID id PK
        +UUID tenantId FK
        +UUID sucursalId FK
        +UUID varianteId FK
        +Int cantidadDisponible
        +Int cantidadReservada
        +Int cantidadTransito
    }

    class MovimientoInventario {
        +UUID id PK
        +UUID tenantId FK
        +UUID inventarioId FK
        +String tipo
        +Int cantidad
        +Int saldoAnterior
        +Int saldoNuevo
        +String motivo
    }

    class Carrito {
        +UUID id PK
        +UUID tenantId FK
        +UUID usuarioId FK
        +Json items
    }

    class Venta {
        +UUID id PK
        +UUID tenantId FK
        +UUID usuarioId FK
        +UUID sucursalId FK
        +String numeroComprobante UK
        +BigInt totalCents
        +String estado
        +String canal
    }

    class VentaItem {
        +UUID id PK
        +UUID tenantId FK
        +UUID ventaId FK
        +UUID varianteId FK
        +Int cantidad
        +BigInt precioUnitarioCents
    }

    class Reserva {
        +UUID id PK
        +UUID tenantId FK
        +UUID usuarioId FK
        +UUID sucursalId FK
        +DateTime fechaHoraCita
        +String estado
    }

    class ReservaItem {
        +UUID id PK
        +UUID tenantId FK
        +UUID reservaId FK
        +UUID varianteId FK
    }

    class Pago {
        +UUID id PK
        +UUID tenantId FK
        +UUID ventaId FK
        +String metodo
        +String proveedor
        +BigInt montoCents
        +String estado
        +String referenciaExterna
    }

    class Idempotencia {
        +UUID id PK
        +UUID tenantId FK
        +String clave UK
        +String hashCuerpo
        +String estado
        +Int codigoEstado
        +Json cuerpoRespuesta
    }

    Plan "1" -- "0..*" Suscripcion : rige
    Inquilino "1" -- "1" Suscripcion : contrata
    Inquilino "1" -- "1" InquilinoMarca : personaliza
    Inquilino "1" -- "0..*" Sucursal : opera
    Inquilino "1" -- "0..*" Usuario : agrupa
    Inquilino "1" -- "0..*" Producto : comercializa
    Inquilino "1" -- "0..*" Venta : registra
    Ciudad "1" -- "0..*" Sucursal : localiza
    Sucursal "1" -- "0..*" InventarioSucursal : almacena
    Proveedor "1" -- "0..*" Producto : suministra
    Categoria "1" -- "0..*" Producto : clasifica
    Producto "1" -- "1..*" VarianteProducto : desglosa
    VarianteProducto "1" -- "0..*" InventarioSucursal : cuantifica
    InventarioSucursal "1" -- "0..*" MovimientoInventario : audita
    Usuario "1" -- "0..1" Carrito : posee
    Usuario "1" -- "0..*" Venta : efectua
    Usuario "1" -- "0..*" Reserva : solicita
    Venta "1" -- "1..*" VentaItem : detalla
    Venta "1" -- "0..1" Pago : liquida
    Reserva "1" -- "1..3" ReservaItem : aparta
    Inquilino "1" -- "0..*" Idempotencia : protege
```

---

## 3.2. Diagramas de Robustez (BCE)

Siguiendo el estándar de la metodología ICONIX, el **Análisis de Robustez** actúa como puente dinámico entre los casos de uso esenciales y el diseño detallado. Cada diagrama clasifica los elementos en tres estereotipos formales:
- `<<boundary>>`: Interfaces de usuario web (PWA), móviles nativas (Expo) o pasarelas externas.
- `<<control>>`: Orquestadores de servicios de frontend (PWA Store/Hooks) y controladores de backend NestJS encargados de aplicar validaciones y reglas de negocio.
- `<<entity>>`: Almacenes de persistencia local (IndexedDB / SQLite) y tablas de la base de datos central PostgreSQL.

---

### CU01: Aprovisionar Tienda y Workspace SaaS

![Figura 3.2: Diagrama de Robustez BCE — CU01 Aprovisionamiento SaaS](../diagramas_png/fig3_2_robustez_cu01_provisioning.png)

```mermaid
flowchart LR
    subgraph Actores["Actores"]
        V["🧑 Visitante / Dueño"]
    end

    subgraph Fronteras["Fronteras («boundary»)"]
        UI_PL["UI_PaginaPlanes"]
        UI_REG["UI_FormularioRegistroTienda"]
        GW_PAY["Pasarela_Stripe_Wayra"]
    end

    subgraph Controladores["Controladores («control»)"]
        CTL_TENANT["TenantPublicController\n(POST /saas/tiendas)"]
        SRV_PROV["AprovisionadorWorkspaceService"]
        VAL_PLAN["ValidadorLimitesPlan"]
    end

    subgraph Entidades["Entidades («entity» / BD)"]
        E_INQ[("inquilinos")]
        E_SUS[("suscripciones")]
        E_MAR[("inquilino_marca")]
        E_USR[("usuarios (ADMIN)")]
        E_SUC[("sucursales (Matriz)")]
        E_CAT[("catalogo_base")]
    end

    V --> UI_PL
    UI_PL --> UI_REG
    UI_REG -->|1: Enviar datos alta| CTL_TENANT
    CTL_TENANT -->|2: Validar slug y plan| VAL_PLAN
    CTL_TENANT -->|3: Iniciar transaccion atomica| SRV_PROV
    SRV_PROV -->|4: Insertar inquilino TRIAL| E_INQ
    SRV_PROV -->|5: Asignar suscripcion| E_SUS
    SRV_PROV -->|6: Asignar marca neutra| E_MAR
    SRV_PROV -->|7: Crear admin hash BCrypt| E_USR
    SRV_PROV -->|8: Crear sucursal matriz| E_SUC
    SRV_PROV -->|9: Sembrar catalogo inicial| E_CAT
    SRV_PROV -.->|10: Cobro B2B si aplica| GW_PAY
    CTL_TENANT -->|"11: 201 Created + JWT"| UI_REG
```

---

### CU03: Personalizar Identidad Visual de Boutique (WCAG 2.1)

![Figura 3.3: Diagrama de Robustez BCE — CU03 Identidad Visual WCAG 2.1](../diagramas_png/fig3_2_robustez_cu03_branding.png)

```mermaid
flowchart LR
    subgraph Actores["Actores"]
        ADM["👑 Admin Boutique"]
    end

    subgraph Fronteras["Fronteras («boundary»)"]
        UI_APAR["UI_PanelApariencia\n(/admin/apariencia)"]
        WID_COL["Widget_SelectorColor"]
        MOD_AJU["Modal_AjusteContrasteOKLCH"]
    end

    subgraph Controladores["Controladores («control»)"]
        HOOK_TEMA["useMarcaForm (Frontend)"]
        VAL_WCAG["ValidadorContrasteWCAG\n(ratio >= 4.5:1)"]
        CTL_MARCA["MiMarcaController\n(PUT /saas/mi-marca)"]
        SRV_MARCA["MarcaService (Backend)"]
    end

    subgraph Entidades["Entidades («entity» / BD)"]
        E_MARCA[("inquilino_marca")]
        E_PLAN[("planes (nivelMarca)")]
    end

    ADM --> UI_APAR
    UI_APAR --> WID_COL
    WID_COL -->|"1: onChangeColor(hex)"| HOOK_TEMA
    HOOK_TEMA -->|2: Calcular luminancia| VAL_WCAG
    VAL_WCAG -->|"3: Ratio < 4.5:1 (Alerta)"| UI_APAR
    UI_APAR -.->|"4: Ajustar contraste"| MOD_AJU
    MOD_AJU -->|"5: Hex ajustado 4.5:1"| HOOK_TEMA
    UI_APAR -->|6: PUT /saas/mi-marca| CTL_MARCA
    CTL_MARCA -->|7: Verificar cuota nivelMarca| E_PLAN
    CTL_MARCA -->|8: Actualizar tokens visuales| SRV_MARCA
    SRV_MARCA -->|9: UPDATE| E_MARCA
    CTL_MARCA -->|"10: 200 OK + CSS Vars"| UI_APAR
```

---

### CU10: Operar en Modo Desconectado con Sincronización Segura

![Figura 3.4: Diagrama de Robustez BCE Dual — CU10 Sincronización Offline e Idempotencia](../diagramas_png/fig3_2_robustez_cu10_offline.png)

```mermaid
flowchart LR
    subgraph Actores["Actores"]
        CLI["👗 Clienta (Web PWA o App Móvil)"]
    end

    subgraph Fronteras["Fronteras («boundary» Dual)"]
        UI_WEB["PantallaWebTienda (PWA)"]
        UI_MOV["PantallaMovilApp (Expo)"]
    end

    subgraph Controladores_Cliente["Controladores Cliente («control» Frontend)"]
        SW_MGR["ServiceWorkerManager"]
        NET_LST["NetInfoListener"]
        OUTBOX["OutboxManager (FIFO)"]
    end

    subgraph Almacenes_Locales["Almacenamiento Desconectado («entity» Local)"]
        IDB_LOC[("IndexedDB\n(catalogo_cache / outbox)")]
        SQL_LOC[("SQLite Local\n(expo-sqlite)")]
    end

    subgraph Backend_Control["Controladores Centrales («control» NestJS)"]
        IDEM_INT["IdempotenciaInterceptor\n(SHA-256)"]
        CHK_CTL["VentasController\n(POST /ventas/carrito/:usuarioId/checkout)"]
        INV_SRV["InventarioSucursalService"]
    end

    subgraph Entidades_Centrales["Base de Datos Central («entity» PostgreSQL)"]
        T_IDEM[("idempotencia")]
        T_VNT[("ventas / venta_items")]
        T_INV[("inventario_sucursal")]
    end

    CLI --> UI_WEB & UI_MOV
    UI_WEB -->|1: Checkout o reserva offline| SW_MGR
    UI_MOV -->|1: Checkout o reserva offline| NET_LST
    SW_MGR -->|2: Deduccion local y encolar| IDB_LOC
    NET_LST -->|2: Deduccion local y encolar| SQL_LOC
    OUTBOX -->|3: Evento reconexion online| IDB_LOC & SQL_LOC
    OUTBOX -->|"4: POST checkout (Idempotency-Key)"| IDEM_INT
    IDEM_INT -->|5: Hash SHA-256| T_IDEM
    IDEM_INT -->|6: Ejecutar venta si es MISS| CHK_CTL
    CHK_CTL -->|7: UPDATE atomico condicionado| INV_SRV
    INV_SRV -->|8: Descontar stock| T_INV
    CHK_CTL -->|9: Insertar venta C-XXXXXXXX| T_VNT
    CHK_CTL -->|"10: 201 Created (X-Cache: MISS)"| OUTBOX
    OUTBOX -->|11: Marcar CONFIRMADA| IDB_LOC & SQL_LOC
```

---

### CU11: Resolver Conflicto de Concurrencia de Stock (`stock = 1`)

![Figura 3.5: Diagrama de Robustez BCE Dual — CU11 Resolución Concurrente de Stock](../diagramas_png/fig3_2_robustez_cu11_conflicto.png)

```mermaid
flowchart LR
    subgraph Actores["Actores"]
        U1["👗 Clienta A — App Móvil (sincroniza primero)"]
        U2["👗 Clienta B — Web PWA (sincroniza después)"]
    end

    subgraph Fronteras["Fronteras («boundary» Dual)"]
        UI_MOV["PantallaMovilApp (Expo)"]
        UI_PWA["PantallaWebTienda (PWA)"]
        MODAL_CONF["ModalConflictoStock\n(Frontend)"]
    end

    subgraph Control_Cliente["Controladores Cliente («control» Frontend)"]
        OUTBOX_MGR["OutboxManager"]
    end

    subgraph Backend_Control["Controladores Backend («control» NestJS)"]
        VNT_CTL["VentasController"]
        INV_SRV["InventarioSucursalService"]
    end

    subgraph Entidades_Datos["Entidades («entity» PostgreSQL)"]
        T_STOCK[("inventario_sucursal\n(cantidad = 0)")]
    end

    U1 --> UI_MOV
    UI_MOV -->|"0: Checkout de la última unidad → 201 (stock = 0)"| VNT_CTL
    U2 --> UI_PWA
    UI_PWA -->|1: Sincronizar orden rezagada| OUTBOX_MGR
    OUTBOX_MGR -->|"2: POST checkout (Idempotency-Key)"| VNT_CTL
    VNT_CTL -->|3: Intentar UPDATE condicionado| INV_SRV
    INV_SRV -->|"4: WHERE cantidad >= 1 (0 filas)"| T_STOCK
    INV_SRV -->|"5: Lanza StockInsuficienteException"| VNT_CTL
    VNT_CTL -->|"6: HTTP 409 STOCK_AGOTADO_CONFLICTO"| OUTBOX_MGR
    OUTBOX_MGR -->|"7: Transicion a COMPENSADA (Rollback local)"| OUTBOX_MGR
    OUTBOX_MGR -->|8: Despachar mirroria:conflicto-stock| MODAL_CONF
    MODAL_CONF -->|"9: Desplegar alternativas guiadas"| U2
```

---

## 3.3. Diagramas de Secuencia UML 2.5

Los diagramas de secuencia mantienen **isomorfismo estricto** con las líneas de vida identificadas en el análisis de robustez, modelando los mensajes HTTP, códigos de estado, parámetros de cabecera y bifurcaciones transaccionales.

---

### Secuencia CU01: Aprovisionamiento Atómico SaaS

![Figura 3.6: Diagrama de Secuencia UML — CU01 Aprovisionamiento de Tienda SaaS](../diagramas_png/fig3_3_secuencia_cu01_provisioning.png)

```mermaid
sequenceDiagram
    autonumber
    actor V as Visitante / Dueño
    participant UI as UI_FormularioRegistro
    participant API as TenantPublicController
    participant SRV as AprovisionadorWorkspaceService
    participant BD as PostgreSQL 16 (mirroria_db)

    V->>UI: Completa nombre, slug, ciudad y credenciales admin
    UI->>API: GET /saas/tiendas/disponibilidad?slug=tienda-boutique
    API->>BD: SELECT COUNT(*) FROM inquilinos WHERE slug = :slug
    BD-->>API: 0 registros
    API-->>UI: 200 OK (disponible: true)

    V->>UI: Pulsa "Crear mi tienda"
    UI->>API: POST /saas/tiendas (Payload con plan, tienda y admin)
    activate API
    API->>SRV: aprovisionarTienda(dto)
    activate SRV
    SRV->>BD: BEGIN TRANSACTION
    SRV->>BD: INSERT INTO inquilinos (slug, estado='TRIAL', trial_ends_at=NOW()+14d)
    SRV->>BD: INSERT INTO inquilino_marca (tenant_id, paleta neutra)
    SRV->>BD: INSERT INTO suscripciones (tenant_id, plan_id, estado='TRIAL')
    SRV->>BD: INSERT INTO usuarios (tenant_id, email, password_hash=BCrypt, rol='ADMIN')
    SRV->>BD: INSERT INTO sucursales (tenant_id, ciudad_id, nombre='Matriz', es_matriz=true)
    SRV->>BD: INSERT INTO proveedores (tenant_id, razon_social='Producción propia')
    SRV->>BD: INSERT INTO categorias / productos (Sembrado base de catalogo)
    SRV->>BD: COMMIT TRANSACTION
    SRV-->>API: { inquilino, adminUser, tokenJwt }
    deactivate SRV
    API-->>UI: 201 Created (Token JWT + tenantId)
    deactivate API
    UI-->>V: Redirección automática a /admin/dashboard
```

---

### Secuencia CU10: Operación Offline, Outbox e Idempotencia

![Figura 3.7: Diagrama de Secuencia UML — CU10 Operación Desconectada y Sincronización Outbox](../diagramas_png/fig3_3_secuencia_cu10_offline.png)

```mermaid
sequenceDiagram
    autonumber
    actor CJ as Clienta
    participant UI as PantallaWebTienda / PantallaMovilApp
    participant LOC as Almacén Local (IndexedDB / SQLite)
    participant OUT as OutboxManager
    participant API as Backend NestJS
    participant IDEM as Tabla idempotencia
    participant BD as Inventario & Ventas

    Note over CJ,LOC: Operación Desconectada (Modo Offline)
    CJ->>UI: Confirma la compra del carrito sin conexión
    UI->>LOC: Genera UUIDv4 + Comprobante provisional LOCAL-<UUID>
    UI->>LOC: Descuenta existencias locales provisionales
    UI->>LOC: Encola en Outbox (estado='PENDIENTE', payload, Idempotency-Key)
    UI-->>CJ: Notifica: "Compra guardada — pendiente de confirmar"

    Note over UI,API: Evento de Red 'online' (Reconexión)
    OUT->>LOC: Obtiene lote de operaciones pendientes (FIFO)
    OUT->>API: POST /api/v1/ventas/carrito/:usuarioId/checkout (Header: Idempotency-Key: <UUIDv4>)
    activate API
    API->>IDEM: SELECT * FROM idempotencia WHERE tenant_id = :tId AND clave = :key
    alt Cache HIT (Clave ya procesada previamente)
        IDEM-->>API: Fila con estado='COMPLETADO' y cuerpo_respuesta
        API-->>OUT: HTTP 200 OK (X-Cache-Idempotency: HIT)
    else Cache MISS (Nueva Transacción)
        API->>IDEM: INSERT INTO idempotencia (clave, hash_cuerpo=SHA256, estado='EN_PROCESO')
        API->>BD: BEGIN TRANSACTION
        API->>BD: UPDATE inventario_sucursal SET disponible = disponible - 1 WHERE disponible >= 1
        BD-->>API: 1 fila afectada (Stock confirmado)
        API->>BD: INSERT INTO ventas (numero_comprobante='C-XXXXXXXX', estado='PENDIENTE')
        API->>BD: COMMIT TRANSACTION
        API->>IDEM: UPDATE idempotencia SET estado='COMPLETADO', respuesta={...}
        API-->>OUT: HTTP 201 Created (X-Cache-Idempotency: MISS, comprobante: 'C-XXXXXXXX')
    end
    deactivate API
    OUT->>LOC: Actualiza orden a estado='CONFIRMADA'
    OUT->>UI: Refresca existencias confirmadas del servidor
    UI-->>CJ: Abre el pago (Stripe, Wayra QR o efectivo en caja, que la cajera confirma en la web)
```

---

### Secuencia CU11: Conflicto Concurrente `stock = 1` y Compensación

![Figura 3.8: Diagrama de Secuencia UML — CU11 Conflicto Concurrente de Stock y Compensación](../diagramas_png/fig3_4_secuencia_cu11_conflicto.png)

```mermaid
sequenceDiagram
    autonumber
    actor CLI as Clienta B (Web PWA, sincroniza después)
    participant UI as PantallaWebTienda (o PantallaMovilApp)
    participant OUT as OutboxManager
    participant API as VentasController
    participant INV as InventarioSucursalService
    participant BD as inventario_sucursal (PostgreSQL)
    participant MOD as ModalConflictoStock

    Note over CLI,BD: La Clienta A (App Móvil) ya sincronizó su compra de la última unidad: stock = 0
    OUT->>API: POST /api/v1/ventas/carrito/:usuarioId/checkout (Idempotency-Key: <UUID>)
    activate API
    API->>INV: descontarStock(sucursalId, prendaId, cantidad=1)
    activate INV
    INV->>BD: SELECT * FROM inventario_sucursal WHERE ... FOR UPDATE
    INV->>BD: UPDATE inventario_sucursal SET cantidad = cantidad - 1 WHERE cantidad >= 1
    BD-->>INV: 0 filas actualizadas (Existencias agotadas previamente por la Clienta A)
    INV-->>API: throw StockInsuficienteException('STOCK_AGOTADO_CONFLICTO')
    deactivate INV
    API-->>OUT: HTTP 409 Conflict { codigo: "STOCK_AGOTADO_CONFLICTO", detalles: { alternativas } }
    deactivate API

    OUT->>OUT: Transiciona orden a estado='COMPENSADA' (Rollback local)
    OUT->>UI: window.dispatchEvent('mirroria:conflicto-stock', detalles)
    UI->>MOD: Monta diálogo ModalConflictoStock con alternativas
    MOD-->>CLI: Alerta: "Prenda adquirida por otra clienta. Tu compra fue cancelada sin cargo."
    MOD-->>CLI: Sugiere: "Disponible en Sucursal Equipetrol (1 u.) o en Talla M"
    CLI->>MOD: Selecciona "Retirar en Sucursal Equipetrol"
    MOD->>UI: Reconfigura orden con la alternativa aceptada
```

---

### Secuencia CU16: Inferencia de Machine Learning con Fallback Heurístico

![Figura 3.9: Diagrama de Secuencia UML — CU16 Inferencia Machine Learning con Fallback Heurístico](../diagramas_png/fig3_3_secuencia_cu16_ml_fallback.png)

```mermaid
sequenceDiagram
    autonumber
    actor ADM as Dueño de Boutique (ADMIN)
    participant UI as UI_DashboardML (/admin/ml)
    participant BACK as MlService (NestJS :3000)
    participant INT as MlFallbackInterceptor
    participant ML_PY as Microservicio mirroria-ml (FastAPI :8002)

    ADM->>UI: Accede a "Predicciones" (Pestaña Demanda a 30 días)
    UI->>BACK: GET /api/v1/ml/kpis/demanda?dias=30
    activate BACK
    BACK->>ML_PY: POST http://mirroria-ml:8002/predict/demanda (Timeout: 3.000 ms)
    
    alt Microservicio Python Online (Inferencia Exitosa)
        ML_PY-->>BACK: 200 OK { modelo: "RandomForestRegressor", R2: 0.9566, proyecciones: [...] }
        BACK->>INT: Inyecta cabecera X-ML-Fallback: false
        INT-->>UI: 200 OK (X-ML-Fallback: false, datos de inferencia)
        UI-->>ADM: Muestra recomendaciones de reposición automáticas
    else Timeout (> 3s) o Microservicio Offline (Fallo de Red)
        ML_PY--xBACK: Conexión rechazada / AbortController Timeout
        BACK->>BACK: ejecutarFallbackDemandaHeuristica(tenantId, dias=30)
        Note over BACK: Calcula demanda proporcional y cobertura de stock en percha
        BACK->>INT: Inyecta cabecera X-ML-Fallback: true
        INT-->>UI: 200 OK (X-ML-Fallback: true, estimación matemática)
        UI-->>ADM: Muestra datos de reposición con etiqueta informativa: "Estimación de respaldo"
    end
    deactivate BACK
```

---

## 3.4. Diagrama de Clases de Análisis y Diseño UML

A continuación se modela la arquitectura de diseño estructurada en capas (`Boundary`, `Control` y `Entity`) para los casos de uso nucleares:

![Figura 3.10: Diagrama de Clases de Análisis y Diseño UML 2.5](../diagramas_png/fig3_5_clases_diseno.png)

```mermaid
classDiagram
    direction TB

    class UI_FormularioRegistro {
        <<boundary>>
        -slug: String
        -nombre: String
        -planCodigo: String
        +onSlugChange()
        +onSubmit()
    }

    class PantallaWebTienda {
        <<boundary>>
        -carritoItems: Array
        -modoOffline: Boolean
        +onAgregarAlCarrito()
        +onConfirmarCompra()
        +sincronizarCola()
    }

    class PantallaMovilApp {
        <<boundary>>
        -carritoItems: Array
        -modoOffline: Boolean
        +onConfirmarCompra()
        +onReservar()
        +onComprarLoReservado()
    }

    class NetInfoListener {
        <<control>>
        +estaEnLinea(): Boolean
        +alReconectar(callback)
    }

    class PantallaConsolaCaja {
        <<boundary>>
        -cobrosPendientes: Array
        -agendaHoy: Array
        +onConfirmarCobroEfectivo(pagoId)
        +onMarcarEnTienda(codigoPase)
    }

    class ModalConflictoStock {
        <<boundary>>
        -alternativasSucursales: Array
        -alternativasTallas: Array
        +onSeleccionarAlternativa()
        +onDescartarOrden()
    }

    class OutboxManager {
        <<control>>
        +encolarOperacion(tipo, payload)
        +drenarColaFIFO()
        +compensarTransaccion(id)
    }

    class IdempotenciaInterceptor {
        <<control>>
        -hashearPayload(body): String
        +intercept(context, next)
    }

    class VentasService {
        <<control>>
        +procesarCheckoutDigital(dto)
        +comprarDesdeReserva(reservaId)
        +comprobanteDe(ventaId): String
    }

    class InventarioSucursalService {
        <<control>>
        +descontarStockAtomico(varianteId, cant)
        +adquirirBloqueoPesimista(inventarioId)
    }

    class MlService {
        <<control>>
        +obtenerPrediccionDemanda(dias)
        -ejecutarFallbackHeuristico(dias)
    }

    class IdempotenciaEntity {
        <<entity>>
        +UUID id
        +UUID tenantId
        +String clave
        +String hashCuerpo
        +String estado
        +Json cuerpoRespuesta
    }

    class VentaEntity {
        <<entity>>
        +UUID id
        +UUID tenantId
        +String numeroComprobante
        +BigInt totalCents
        +String estado
    }

    class InventarioSucursalEntity {
        <<entity>>
        +UUID id
        +UUID tenantId
        +Int cantidadDisponible
        +Int cantidadReservada
    }

    UI_FormularioRegistro ..> VentasService : consume
    PantallaWebTienda ..> OutboxManager : encola
    PantallaMovilApp ..> NetInfoListener : escucha red
    PantallaMovilApp ..> OutboxManager : encola
    OutboxManager ..> IdempotenciaInterceptor : despacha HTTP
    IdempotenciaInterceptor ..> VentasService : autoriza
    VentasService ..> InventarioSucursalService : invoca
    VentasService ..> VentaEntity : persiste
    InventarioSucursalService ..> InventarioSucursalEntity : actualiza
    IdempotenciaInterceptor ..> IdempotenciaEntity : cachea
    InventarioSucursalService ..> ModalConflictoStock : notifica conflicto
    PantallaConsolaCaja ..> MlService : consulta semáforo No-Show
```

---

## 3.5. Diseño de la Base de Datos Relacional (PostgreSQL 16)

La base de datos relacional compartida (`mirroria_db`) se compone de **30 tablas normalizadas**, donde todas las entidades transaccionales y de negocio implementan `tenant_id: UUID NOT NULL` para aislamiento multi-tenant.

![Figura 3.11: Diagrama Entidad-Relación Físico — 30 Tablas en PostgreSQL 16](../diagramas_png/fig3_6_diagrama_er.png)

```mermaid
erDiagram
    PLANES ||--o{ SUSCRIPCIONES : "rige"
    INQUILINOS ||--|| SUSCRIPCIONES : "contrata"
    INQUILINOS ||--|| INQUILINO_MARCA : "personaliza"
    INQUILINOS ||--o{ COBROS_SUSCRIPCION : "paga"
    INQUILINOS ||--o{ EVENTOS_PLATAFORMA : "audita"
    INQUILINOS ||--o{ SUCURSALES : "posee"
    INQUILINOS ||--o{ USUARIOS : "agrupa"
    INQUILINOS ||--o{ PRODUCTOS : "comercializa"
    INQUILINOS ||--o{ VENTAS : "factura"
    INQUILINOS ||--o{ IDEMPOTENCIA : "protege"

    CIUDADES ||--o{ SUCURSALES : "ubica"
    SUCURSALES ||--o{ INVENTARIO_SUCURSAL : "alberga"
    SUCURSALES ||--o{ ORDENES_COMPRA : "destina"
    SUCURSALES ||--o{ RESERVAS : "agenda"

    PROVEEDORES ||--o{ PRODUCTOS : "suministra"
    CATEGORIAS ||--o{ PRODUCTOS : "clasifica"
    TEMPORADAS ||--o{ COLECCIONES : "organiza"
    COLECCIONES ||--o{ PRODUCTOS : "agrupa"

    PRODUCTOS ||--|{ VARIANTES_PRODUCTO : "desglosa"
    TALLAS ||--o{ VARIANTES_PRODUCTO : "dimensiona"
    COLORES ||--o{ VARIANTES_PRODUCTO : "estiliza"
    VARIANTES_PRODUCTO ||--o{ INVENTARIO_SUCURSAL : "mantiene"

    INVENTARIO_SUCURSAL ||--o{ MOVIMIENTOS_INVENTARIO : "traza"
    USUARIOS ||--o| CARRITOS : "mantiene"
    USUARIOS ||--o{ REFRESH_TOKENS : "emite"
    USUARIOS ||--o{ VENTAS : "compra"
    USUARIOS ||--o{ RESERVAS : "solicita"
    USUARIOS ||--o{ INTERACCIONES_IA : "formula"

    VENTAS ||--|{ VENTA_ITEMS : "contiene"
    VENTAS ||--o| PAGOS : "liquida"
    RESERVAS ||--|{ RESERVA_ITEMS : "aparta"
    CUPONES ||--o{ VENTAS : "descuenta"

    PLANES {
        uuid id PK
        varchar codigo UK
        varchar nombre
        bigint precio_mensual_cents
        int max_sucursales
        int max_productos
        int max_usuarios_staff
        varchar nivel_marca
    }

    INQUILINOS {
        uuid id PK
        varchar slug UK
        varchar nombre_comercial
        varchar estado
        timestamp trial_ends_at
    }

    SUSCRIPCIONES {
        uuid id PK
        uuid inquilino_id FK
        uuid plan_id FK
        varchar estado
        timestamp fecha_vencimiento
    }

    INQUILINO_MARCA {
        uuid id PK
        uuid inquilino_id FK
        varchar color_principal
        varchar color_acento
        varchar modo
        varchar tipografia
        boolean mostrar_insignia
    }

    USUARIOS {
        uuid id PK
        uuid tenant_id FK
        uuid sucursal_id FK
        varchar email
        varchar password_hash
        varchar rol
        boolean activo
    }

    SUCURSALES {
        uuid id PK
        uuid tenant_id FK
        uuid ciudad_id FK
        varchar nombre
        varchar direccion
        boolean es_matriz
    }

    PRODUCTOS {
        uuid id PK
        uuid tenant_id FK
        uuid categoria_id FK
        uuid proveedor_id FK
        varchar titulo
        bigint precio_cents
        jsonb imagenes
        boolean activo
    }

    VARIANTES_PRODUCTO {
        uuid id PK
        uuid tenant_id FK
        uuid producto_id FK
        varchar sku UK
        varchar talla
        varchar color_hex
    }

    INVENTARIO_SUCURSAL {
        uuid id PK
        uuid tenant_id FK
        uuid sucursal_id FK
        uuid variante_id FK
        int cantidad_disponible
        int cantidad_reservada
        int cantidad_transito
    }

    VENTAS {
        uuid id PK
        uuid tenant_id FK
        uuid usuario_id FK
        uuid sucursal_id FK
        varchar numero_comprobante UK
        bigint total_cents
        varchar estado
        varchar canal
    }

    IDEMPOTENCIA {
        uuid id PK
        uuid tenant_id FK
        varchar clave UK
        varchar hash_cuerpo
        varchar estado
        int codigo_estado
        jsonb cuerpo_respuesta
        timestamp expira_en
    }
```

---

## 3.6. Diseño de Interfaces de Usuario

Siguiendo el principio de **alta fidelidad y correspondencia con el código**, las interfaces se articulan en tres mundos funcionales claros:

1. **Consola Global de la Plataforma MirrorIA (`/plataforma/*`):**
   - Dashboard directivo con indicadores agregados de MRR, ARR, Churn Rate y volumen transaccionado (GMV).
   - Tabla administrativa de inquilinos con conmutador de estado (Activa / Suspendida), selector de plan comercial y botón de restablecimiento de marca de oficio.
2. **Tienda Web Pública y Vitrina Omnicanal (`/t/:slug/*`):**
   - Inyección dinámica de tokens de diseño en `:root` (logotipo, tipografías, radio de curvatura en botones y colores).
   - Ficha técnica interactiva de prendas con selector de variantes SKU, consulta de existencias por sucursal física e integración con el **Probador Virtual por IA** (Decart `lucy-vton-3.5`).
   - Carrito de compras persistente (`jsonb`) con tope de 3 unidades por variante y flujo de checkout con validación de cupones y pasarelas de pago (Stripe Checkout y Wayra QR dinámico).
3. **Panel Administrativo de la Tienda (`/admin/*`, solo web; sin punto de venta):**
   - **Personalización de Marca (`/admin/apariencia`):** Paleta interactiva con indicador visual accesible **WCAG 2.1** (alerta ámbar si el ratio es $< 4.5:1$ y botón de ajuste automático en espacio OKLCH).
   - **Consola Ejecutiva de BI (`/admin/dashboard` para ADMIN):** Resumen de ingresos netos con deltas simétricos, ticket promedio, rotación de inventario, tasa de conversión y gráficos de tendencia Recharts.
   - **Consola de Caja (`/admin/dashboard` y `/admin/cobros` para Cajera y Encargado):** Corte diario local en `America/La_Paz`, cobros en efectivo pendientes de verificar (la cajera es el único rol que confirma dinero), alertas visuales de existencias críticas ($\le 2$ unidades) o agotadas, y agenda de citas de probador con llegada a tienda en un clic buscando el Pase de Tienda por su código.
   - **Operativa Offline de la clienta (PWA):** Banner persistente `⚡ Sin conexión — operando con datos locales`, checkout y reservas encolados como "Pendiente de confirmar" y diálogo interactivo `ModalConflictoStock` con sugerencia guiada de alternativas.
   - **Consola de Predicciones y Machine Learning (`/admin/ml`):** Tarjetas ejecutivas en lenguaje de negocio para reposición a 30 días, semáforo de riesgo de inasistencia (*no-show*), segmentación RFM y panel lateral `FichaTecnicaSheet` con el rigor científico formal ($N=10.000$, `seed=42`).
   - **Reportes con IA y Excel (`/admin/reportes`):** Asistente conversacional en lenguaje natural, tabla dinámica interactiva con repivoteo en vivo y botón de descarga directa de balances contables a formato nativo `.xlsx` (`exceljs`).
4. **App Móvil de la Clienta (`mirroria-mobile/`, Expo; solo clienta y visitante):**
   - Selector de tienda con la marca de la plataforma; luego toda la app se pinta con la marca de la tienda elegida (colores, logo, modo claro u oscuro).
   - Pestañas **Vitrina · Probador · Carrito · Mis cosas**: vitrina offline desde el espejo SQLite con stock por sucursal, escaneo de la etiqueta de una prenda en la tienda física para abrir su ficha, carrito y checkout encolables sin red, pagos (Wayra QR, Stripe, efectivo en caja), reservas con **Pase de Tienda** (QR y código `#XXXXXXXX` que la cajera busca en la web) y **"Comprar lo que reservé"**.
   - Probador con IA (Decart) reservado como "Próximamente" hasta el *development build*.
   - El personal (`ADMIN`, `ENCARGADO_SUCURSAL`, `CAJERO`) no tiene app móvil.
