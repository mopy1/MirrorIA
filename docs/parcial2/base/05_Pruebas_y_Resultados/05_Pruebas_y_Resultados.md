---
tags:
  - si2
  - parcial2
  - mirroria
  - pruebas
  - aseguramiento_calidad
  - vitest
  - capitulo5
date: 2026-11-07
---

# CAPÍTULO V. PRUEBAS Y RESULTADOS

---

## 5.1. Plan de Pruebas

El objetivo primordial del plan de pruebas es garantizar que la plataforma **MirrorIA** cumpla con los requisitos funcionales (RF01 a RF26), los requisitos no funcionales (RNF01 a RNF12) y las 14 reglas de negocio bajo condiciones de estrés, concurrencia y fallas de conectividad.

El alcance de las pruebas cubre los cinco módulos del sistema:
1. **Gestión Multitenant y Suscripciones:** Aislamiento de datos con `tenant_id`, control de cuotas por plan comercial y cobros recurrentes B2B.
2. **Catálogo, Inventario y Puntos de Venta (POS):** Bloqueos pesimistas en deducción de existencias y emisión de comprobantes `C-XXXXXXXX`.
3. **Experiencia del Cliente y Probador Virtual IA:** Generación segura de tokens efímeros para Decart AI y flujo de citas para probador físico.
4. **Operación Offline-First y Sincronización:** Persistencia en IndexedDB / SQLite, protocolo de idempotencia SHA-256 y resolución determinista del conflicto concurrente `stock = 1`.
5. **Reportes con IA y Machine Learning:** Precisión de inferencia en Python FastAPI (:8002) y fallback heurístico resiliente ante caídas.

### Tabla 5.1: Modelo de Plan de Pruebas por Módulo

| Módulo | Tipo de Prueba | Objetivo Principal | Herramienta / Entorno | Criterio de Aceptación | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Multitenant y Suscripciones** | Funcional / Seguridad | Verificar que ninguna petición con JWT de una tienda acceda a registros de otro inquilino y certificar el control de cuotas del plan. | Vitest / Python (`qa_aislamiento.py`) | 100% de peticiones cruzadas devuelven HTTP 403 o 404. Control de cuotas rechaza excedentes con HTTP 409. | Equipo Backend |
| **Catálogo e Inventario** | Integración / Concurrencia | Certificar que `UPDATE` condicionado previene inventarios negativos bajo concurrencia pesimista. | Vitest e2e / PostgreSQL 16 | Cero existencias negativas en `cantidad_disponible` y registro inmutable en `movimientos_inventario`. | Equipo Backend |
| **Operación Offline y Sync** | Resiliencia / Integración | Validar persistencia en IndexedDB, drenado por outbox FIFO, idempotencia con hash SHA-256 y resolución del conflicto `stock = 1`. | Vitest / Playwright en PWA sin red | Reenvíos sucesivos retornan `X-Cache-Idempotency: HIT`. Colisión en última prenda emite HTTP 409 tipado y activa rollback compensatorio. | Equipo Frontend / QA |
| **Experiencia y Probador IA** | Seguridad / Funcional | Validar que la emisión de credenciales de Decart AI no exponga API keys y cumpla el límite de tasa por IP. | Vitest / Supertest | Token efímero expira a los 5 minutos; peticiones $> 10$ en 10 min reciben HTTP 429. | Equipo Backend |
| **Machine Learning y Analítica** | Rendimiento / Disponibilidad | Validar métricas de modelos (M1 a M4) y verificar activación automática del fallback heurístico ante caída del servicio en :8002. | Pytest / Vitest (`MlFallbackInterceptor`) | Timeout $\le 1.500$ ms; al apagar el contenedor se emite `X-ML-Fallback: true` con estimación matemática coherente. | Equipo ML / Backend |

---

## 5.2. Pruebas Funcionales

Las pruebas funcionales verifican el comportamiento de cada Caso de Uso ante entradas válidas, flujos alternativos y violaciones de reglas de negocio:

### Tabla 5.2: Registro de Pruebas Funcionales Ejecutadas

| ID | Caso de Uso / RF | Descripción de la Prueba | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PF-01** | CU01 / RF01 | Registrar una nueva boutique mediante el endpoint público `/saas/tiendas` con slug único. | Aprovisionamiento atómico: crea inquilino, marca, sucursal, proveedor propio y usuario `ADMIN` en estado `TRIAL` (14 días). | Aprovisionamiento completado en 112 ms; emite token JWT y redirige a `/admin/dashboard`. | **Aprobado** |
| **PF-02** | CU02 / RF03 | Crear una segunda sucursal en una boutique suscrita al Plan Básico (`maxSucursales = 1`). | El sistema rechaza la operación con código HTTP 409 informando que se alcanzó el límite del plan. | Emite HTTP 409 `LimitePlanExcedidoException` indicando el límite del plan; seis altas simultáneas tampoco lo superan (bloqueo por tienda). | **Aprobado** |
| **PF-03** | CU03 / RF11 | Configurar un color principal de tienda con contraste deficiente contra el fondo blanco (ej. `#FFFF00`). | El sistema calcula el ratio WCAG 2.1 ($< 4.5:1$), emite alerta visual y bloquea el guardado. | Validador emite ratio 1.07:1, muestra alerta ámbar y herramienta OKLCH recalcula automáticamente a color accesible. | **Aprobado** |
| **PF-04** | CU07 / RF14 | Intentar agregar 4 unidades de una misma variante SKU al carrito de compras digital. | La validación del DTO y del servicio rechaza la solicitud limitando a máximo 3 unidades por variante. | Rechaza con HTTP 409 (regla de negocio) indicando el tope de 3 unidades por talla y color. | **Aprobado** |
| **PF-05** | CU09 / RF15 | Solicitar una cita de probador con 4 prendas o con fecha fuera del rango de 48 horas. | El sistema rechaza la creación de la reserva por violación de los límites anti-acaparamiento. | Rechaza con HTTP 409 (regla de negocio) por el tope de prendas y la ventana de 48 h. | **Aprobado** |
| **PF-06** | CU09 / RF15 | Clienta con 2 inasistencias acumuladas (`NO_SHOW`) intenta agendar una nueva cita. | El sistema constata las 2 faltas en los últimos 30 días y bloquea la creación por 30 días. | Emite HTTP 403 `"Usuario bloqueado para reservas hasta YYYY-MM-DD"`. | **Aprobado** |
| **PF-07** | CU14 / RF23 | Formular una pregunta abierta de ventas al asistente conversacional IA por chat web. | El LLM extrae la intención analítica hacia el catálogo de 23 métricas sin escribir código SQL directo. | Genera consulta parametrizada contra la BD del tenant y narra conclusiones gerenciales sin tecnicismos. | **Aprobado** |
| **PF-08** | CU15 / RF24 | Exportar reporte de ventas dinámico a formato Excel nativo mediante botón de descarga. | Genera libro binario `.xlsx` con membrete de la tienda, formato `"Bs" #,##0.00` y fórmulas GAAP. | Descarga exitosa de archivo `.xlsx` legible en Microsoft Excel con auto-ajuste de columnas. | **Aprobado** |

---

## 5.3. Pruebas de Integración

Las pruebas de integración evalúan el acoplamiento y la comunicación asíncrona entre el backend en NestJS, la base de datos PostgreSQL, el microservicio de Machine Learning en Python, la PWA en React 19 y las pasarelas externas:

### Tabla 5.3: Registro de Pruebas de Integración

| ID | Componentes Integrados | Escenario de Prueba | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PI-01** | PWA (IndexedDB) $\leftrightarrow$ Backend NestJS $\leftrightarrow$ Tabla `idempotencia` | Reenviar una orden de venta offline ya sincronizada utilizando la misma cabecera `Idempotency-Key` (UUID). | El servidor detecta la llave en la tabla `idempotencia`, retorna HTTP 200 con `X-Cache-Idempotency: HIT` y no duplica stock. | Respuesta en 8 ms con cabecera HIT; inventario físico permanece inalterado. | **Aprobado** |
| **PI-02** | Frontend PWA $\leftrightarrow$ Backend NestJS $\leftrightarrow$ PostgreSQL (Concurrencia) | Dos clientes desconectados compiten por la última unidad disponible (`stock = 1`) al recuperar la red. | La primera orden es confirmada; la segunda recibe HTTP 409 `STOCK_AGOTADO_CONFLICTO` y activa compensación. | Servidor rechaza la 2.ª orden; PWA ejecuta rollback en outbox y levanta `ModalConflictoStock`. | **Aprobado** |
| **PI-03** | Backend NestJS $\leftrightarrow$ Microservicio `mirroria-ml` (FastAPI :8002) | Solicitar predicciones de demanda y no-show con el microservicio Python en ejecución. | Inferencia ejecutada por Random Forest y Logistic Regression con cabecera `X-ML-Fallback: false`. | Respuesta en 45 ms con métricas $R^2=0.9566$ y semáforos de asistencia calibrados. | **Aprobado** |
| **PI-04** | Backend NestJS $\leftrightarrow$ Fallback Heurístico (Microservicio Apagado) | Detener el contenedor `mirroria_ml` y solicitar predicciones desde el panel administrativo. | El interceptor detecta timeout/caída de red, ejecuta el cálculo heurístico y emite `X-ML-Fallback: true`. | Sistema entrega estimaciones matemáticas de cobertura sin interrumpir la interfaz web. | **Aprobado** |
| **PI-05** | Backend NestJS $\leftrightarrow$ Pasarela Banco Wayra (QR) | Simular callback de pago QR en `POST /pagos/qr/aviso` con firma criptográfica HMAC-SHA256. | Backend verifica firma con `crypto.timingSafeEqual`, asienta el cobro e impide reintentos con el mismo `event_id`. | Pago validado exitosamente; aviso duplicado es ignorado por restricción de unicidad. | **Aprobado** |

---

## 5.4. Registro y Corrección de Errores

Durante las fases iterativas de desarrollo se registraron y subsanaron los siguientes defectos críticos:

### Tabla 5.4: Registro de Defectos Corregidos

| ID | Prueba Asociada | Descripción del Error | Gravedad | Causa Raíz Identificada | Corrección Técnica Aplicada | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ERR-01** | PI-01 | Al reintentar sincronizar una orden offline con payload ligeramente modificado, el backend devolvía error interno 500. | **Alta** | No se comparaba el hash criptográfico del cuerpo contra la clave de idempotencia original. | Se incorporó el hashing SHA-256 canónico (`hash_cuerpo`), emitiendo HTTP 422 `Unprocessable Entity` ante discrepancias de payload. | **Corregido** |
| **ERR-02** | PI-02 | Cuando el stock era 1 y ocurría un conflicto concurrente, la orden en la PWA permanecía bloqueada en estado `PENDIENTE`. | **Crítica** | El gestor outbox no capturaba el código de negocio `STOCK_AGOTADO_CONFLICTO`, tratándolo como fallo genérico de red. | Se añadió la transición explícita al estado `COMPENSADO` y el despacho del evento `mirroria:conflicto-stock` para abrir el modal guiado. | **Corregido** |
| **ERR-03** | PF-03 | Al cambiar una tienda al modo oscuro, los textos principales perdían legibilidad sobre el fondo `#0A0A0A`. | **Media** | El contraste solo se validaba contra fondo blanco predeterminado. | Se actualizó `color.ts` para contrastar contra `FONDO_TIENDA[modo]` y se integró el ajustador perceptual OKLCH. | **Corregido** |
| **ERR-04** | PI-04 | La caída del microservicio Python bloqueaba el hilo de NestJS durante 30 segundos antes de responder. | **Alta** | Las llamadas `fetch` nativas carecían de límite de tiempo de espera (*timeout*). | Se integró `AbortController` con un timeout estricto (hoy **1.500 ms** y una sola dirección) para conmutar de inmediato al fallback heurístico. | **Corregido** |

---

## 5.5. Resumen Consolidado de Resultados

### Tabla 5.5: Métricas Globales de Cobertura de Pruebas

| Suite / Entorno de Pruebas | Total Ejecutadas | Aprobadas | Fallidas | Cobertura / Tasa de Éxito |
| :--- | :--- | :--- | :--- | :--- |
| **Pruebas Unitarias Backend (Vitest)** | 557 | 557 | 0 | **100%** |
| **Pruebas de Integración e2e Backend** | 61 | 61 | 0 | **100%** (Contra PostgreSQL local) |
| **Pruebas Unitarias Frontend (Vitest)** | 345 | 345 | 0 | **100%** |
| **Pruebas App Móvil (Vitest + SQLite real)** | 17 | 17 | 0 | **100%** (+1 de integración contra el backend, que corre aparte) |
| **Pruebas Microservicio ML (Pytest)** | 6 | 6 | 0 | **100%** (Pipelines M1-M4) |
| **QA Automatizado de Aislamiento Tenant** | 84 | 84 | 0 | **100%** (`qa_aislamiento.py`) |
| **QA Automatizado de Reglas de Mostrador/POS**| 21 | 21 | 0 | **100%** (`qa_reglas.py`) |
| **QA Automatizado de Marca y Contraste WCAG** | 37 | 37 | 0 | **100%** (`qa_marca.py`) |
| **TOTAL CONSOLIDADO** | **969** | **969** | **0** | **100% de Aprobación** |

---

## 5.6. Casos de Prueba Detallados

A continuación se formaliza la especificación exhaustiva de dos casos de prueba neurálgicos para la defensa de grado:

### Tabla 5.6.1: Caso de Prueba CP-01 — Aislamiento Multi-Tenant Estricto

| Elemento | Especificación del Caso de Prueba |
| :--- | :--- |
| **Identificador:** | **CP-01** |
| **Caso de Uso Asociado:** | CU01 / CU02 — Aislamiento y Gobernanza Multi-Tenant |
| **Objetivo:** | Demostrar que un usuario autenticado en una boutique (`tiendaria`) no puede leer ni mutar información de otra tienda (`casa-andina`). |
| **Precondiciones:** | Existen dos tiendas activas con datos sembrados: `tiendaria` (Tenant A) y `casa-andina` (Tenant B). |
| **Entradas:** | Petición HTTP `GET /api/v1/ventas` y `PATCH /api/v1/catalogo/productos/:id` enviando el token JWT de `tiendaria` pero con la cabecera `X-Tenant: casa-andina`, o solicitando un UUID perteneciente a Tenant B. |
| **Pasos de Ejecución:** | 1. Iniciar sesión con `admin@mirroria.com` obteniendo token JWT de `tiendaria`.<br>2. Despachar petición enviando cabecera `X-Tenant: casa-andina`.<br>3. Despachar petición `GET /catalogo/productos/<UUID_CASA_ANDINA>` sin cabecera cruzada. |
| **Resultado Esperado:** | En el paso 2: El interceptor detecta discordancia entre el JWT y la cabecera, respondiendo HTTP 403 `"Tu sesión pertenece a otra tienda"`.<br>En el paso 3: La consulta ejecuta `where: soloTenant({...})`, afectando 0 filas y emitiendo HTTP 404 `"No encontrado"`. |
| **Resultado Obtenido:** | HTTP 403 en petición con cabecera ajena; HTTP 404 en consulta por ID foráneo. Cero fuga de información. |
| **Estado Final:** | **Aprobado con Distinción** |

---

### Tabla 5.6.2: Caso de Prueba CP-02 — Concurrencia Desconectada y Conflicto `stock = 1`

| Elemento | Especificación del Caso de Prueba |
| :--- | :--- |
| **Identificador:** | **CP-02** |
| **Caso de Uso Asociado:** | CU10 / CU11 — Resiliencia Offline y Resolución de Conflictos |
| **Objetivo:** | Demostrar que ante dos compras offline simultáneas por la última prenda disponible, el sistema preserva la integridad del stock y activa compensación. |
| **Precondiciones:** | La variante SKU `VEST-ROJO-S` tiene exactamente `cantidad_disponible = 1` en la Sucursal Central. |
| **Entradas:** | Dos transacciones con `Idempotency-Key` diferenciados generadas sin red desde dos terminales (PWA y Móvil). |
| **Pasos de Ejecución:** | 1. Desconectar ambas terminales de la red.<br>2. Registrar una venta de la prenda en la Terminal 1 y otra venta en la Terminal 2.<br>3. Ambas terminales descuentan provisionalmente su almacén local y encolan en outbox.<br>4. Restablecer la conexión en ambas terminales simultáneamente.<br>5. Terminal 1 drena su cola e impacta en el servidor.<br>6. Terminal 2 drena su cola milisegundos después e impacta en el servidor. |
| **Resultado Esperado:** | Terminal 1: El servidor confirma la venta, descuenta el stock a 0 y responde HTTP 201 (`C-XXXXXXXX`).<br>Terminal 2: La sentencia `UPDATE` afecta 0 filas; el servidor responde HTTP 409 `STOCK_AGOTADO_CONFLICTO`. La Terminal 2 ejecuta rollback local y despliega `ModalConflictoStock` sugiriendo otras tiendas o tallas. |
| **Resultado Obtenido:** | Stock en PostgreSQL queda exactamente en 0 (cero inventario negativo); Terminal 1 recibe comprobante fiscal; Terminal 2 revierte su estado local a `COMPENSADO` y ofrece alternativas asistidas a la clienta. |
| **Estado Final:** | **Aprobado con Distinción** |
