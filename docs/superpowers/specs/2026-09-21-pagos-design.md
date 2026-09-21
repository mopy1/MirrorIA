# RF19 / CU12 — Pasarela de pago (módulo `pagos`)

**Fecha:** 2026-09-21
**Estado:** diseño aprobado, pendiente de plan de implementación
**Requisito:** RF19 — *Integrar una pasarela de pago para compras digitales* (mapea a CU12)
**Actores:** `CUSTOMER` (paga), `CAJERO` y `ADMIN` (confirman cobros manuales)

## 1. Problema

`modules/pagos/` es un `@Module({})` vacío. Hoy **ninguna venta digital llega nunca a
`PAGADA`**: `VentasService.checkoutCarrito` la crea en `PENDIENTE` y no existe nada que la
cobre. Solo las ventas presenciales nacen pagadas, porque el cajero ya cobró.

Eso tiene una consecuencia que no es teórica: los reportes de CU24 filtran por
`estado = PAGADA` por defecto —para no contar como ingreso plata que nadie pagó— así que
**el reporte de ingresos solo ve el canal presencial**. Cerrar el circuito de pago es lo que
hace que esos reportes signifiquen algo.

Y hay un segundo problema, anterior a este módulo: **el checkout descuenta el stock antes de
cobrar** (CU12, paso 5d, y así está implementado). Una compra abandonada retiene inventario
para siempre. Con unas pocas, el stock del sistema se vacía solo.

## 2. Alcance

**Dentro:**

- Módulo `pagos`, dueño de la tabla `pagos` — la 23 de 23 del diseño.
- **Cobro con tarjeta** contra Stripe en modo de prueba: página alojada, webhook firmado,
  idempotencia por `event_id`.
- **Cobro manual** para QR y efectivo: la venta queda pendiente y un `CAJERO`/`ADMIN`
  confirma, dejando registro de quién y cuándo.
- **Liberación del stock** cuando el pago se rechaza, se cancela o vence el plazo.
- Pantalla de pago para la clienta y pantalla de confirmación de cobros para el equipo.

**Fuera (decisión explícita, no olvido):**

- **Dinero real.** El documento entregado excluye del alcance "el procesamiento de pagos con
  dinero real" y declara que la integración corre contra el entorno de pruebas. Este diseño
  respeta eso. La única excepción consciente es el QR (§3.4).
- **Reembolsos.** La tabla los contempla (`monto_reembolsado_cents`, `motivo_reembolso`,
  `reembolsado_at`) y el módulo los deja preparados, pero el flujo de devolución de dinero no
  se construye acá.
- PayPal y Libélula, citados en la bibliografía como alternativas evaluadas.

## 3. Decisiones tomadas

### 3.1 Dos caminos de cobro, no tres

Los tres métodos que pide el proyecto se reparten en **dos mecanismos**, porque QR y efectivo
son el mismo flujo con distinta pantalla:

| Método | Proveedor | Quién confirma el cobro |
|---|---|---|
| `TARJETA` | `STRIPE` | El webhook firmado de Stripe |
| `QR` | `MANUAL` | Un `CAJERO` o `ADMIN`, desde el panel |
| `EFECTIVO` | `MANUAL` | Un `CAJERO` o `ADMIN`, al entregar en la sucursal |

`pagos.proveedor_pago` y `pagos.metodo` ya existen en el diseño y quedan con esos valores.

### 3.2 El webhook es la autoridad, no el regreso del navegador

Cuando la clienta vuelve de Stripe, esa redirección **no prueba nada**: se puede falsificar
escribiendo la URL a mano. La venta se marca pagada únicamente cuando llega el webhook y su
firma verifica. La pantalla de regreso solo consulta el estado.

### 3.3 Acá sí se usa el SDK de Stripe

A diferencia del adaptador de Gemini, que habla por `fetch` pelado para no sumar una
dependencia, el módulo de pagos usa el paquete oficial `stripe`. El motivo es acotado y
concreto: **verificar la firma del webhook es criptográfico**, y escrito a mano es
exactamente el tipo de código que falla pareciendo que funciona. Sin esa verificación,
cualquiera que descubra la URL del webhook puede marcar ventas como pagadas.

### 3.4 El QR es real pero su confirmación es manual, y se declara

El QR que se muestra es una imagen provista por el dueño del proyecto (hoy, su QR bancario
personal). **No es una integración:** ningún banco le avisa al backend que hubo un pago, así
que la confirmación la hace una persona. Dos límites que quedan escritos en la documentación
del proyecto en vez de disimulados:

- El mismo QR sirve para todas las ventas, de modo que el sistema **no puede vincular un pago
  a una venta** salvo por monto y hora.
- Un pago por QR mueve dinero real a una cuenta personal, lo que se aparta de la exclusión de
  "dinero real" del documento. Se declara como tal.

La imagen del QR va en configuración (`PAGOS_QR_URL`), no incrustada en el código: si mañana
aparece un convenio bancario, se reemplaza sin tocar el flujo.

### 3.5 El stock vuelve al inventario, y el movimiento se llama `AJUSTE`

Cuando una venta pendiente se rechaza, se cancela o vence, se devuelve al inventario lo que
el checkout había descontado, y la venta pasa a `CANCELADA`.

El movimiento se registra como **`AJUSTE`** con un `motivo` explícito, no como `DEVOLUCION`.
Razón: en una devolución la mercadería vuelve físicamente; acá nunca salió, porque nadie
pagó ni retiró nada. Usar `DEVOLUCION` inflaría la métrica de devoluciones con ventas que
jamás ocurrieron — otro número equivocado que nadie notaría.

### 3.5-bis El cupón también se devuelve

El checkout no solo descuenta stock: si la compra traía un cupón, `consumirCupon` ya
incrementó `usos_actuales`. Hoy no existe forma de devolver ese uso.

Es la misma fuga que la del stock, por otra puerta: una clienta que abandona tres checkouts
con el mismo cupón quema tres usos sin haber comprado nada, y un cupón con tope se agota
solo. Peor que el stock en un aspecto: el tope de usos es una regla de negocio deliberada
—una promoción para las primeras 50 clientas— y esta fuga la vacía con carritos abandonados.

Por eso `promociones` gana `liberarCupon(cuponId, manager?)`, que decrementa `usos_actuales`
con piso en 0, y la cancelación por pago no completado lo llama dentro de la misma
transacción que devuelve el stock. Las dos cosas se deshacen juntas o no se deshace ninguna.

### 3.6 Sin planificador: la expiración se dispara sola y también a mano

El plazo por defecto es de **30 minutos** (`PAGOS_MINUTOS_VENCIMIENTO`). La barrida de
vencidas es un método del servicio que se llama en dos lugares:

- **Oportunistamente**, al inicio de estas tres operaciones y solo de estas: crear una sesión
  de pago, pedir las instrucciones de cobro, y confirmar un cobro manual. Un sistema en uso
  libera su stock sin necesidad de nada corriendo de fondo. **No** se dispara desde el
  webhook: ese camino tiene que ser lo más corto posible, porque Stripe reintenta si tarda.
- **A mano**, desde un endpoint de administración.

Se descartó agregar `@nestjs/schedule`: suma una dependencia y un proceso de fondo que hay
que apagar en las pruebas, y una barrida por reloj **no se puede demostrar en una defensa**
sin esperar a que se cumpla el intervalo. El costo aceptado y declarado: un sistema
completamente ocioso no libera stock hasta que alguien lo use.

### 3.7 `ventas` sigue siendo dueño de su máquina de estados

`pagos` **no** importa entidades de `ventas`. Le pide a `VentasService` —que ya está
exportado— dos operaciones nuevas: `marcarPagada(ventaId, manager?)` y
`cancelarPorPagoNoCompletado(ventaId, motivo, manager?)`. Es el mismo patrón con el que
`ventas` cierra una reserva llamando a `ReservasService.completarPorVenta`.

## 4. Los dos flujos

### 4.1 Tarjeta

```
checkout → venta PENDIENTE (stock ya descontado)
  → POST /pagos/ventas/:id/sesion   → fila en `pagos` (PENDIENTE) + sesión de Stripe
  → la clienta paga en la página de Stripe
  → POST /pagos/webhook/stripe      → firma verificada → pago APROBADO → venta PAGADA
  → la clienta vuelve y la pantalla consulta el estado real
```

Si el pago se rechaza o la clienta abandona, la venta vence a los 30 minutos y el stock
vuelve.

### 4.2 QR y efectivo

```
checkout → venta PENDIENTE (stock ya descontado)
  → GET /pagos/ventas/:id/instrucciones → monto, referencia, y el QR si corresponde
  → la clienta paga por su banco, o va a la sucursal
  → POST /pagos/ventas/:id/confirmar (CAJERO/ADMIN) → pago APROBADO → venta PAGADA
```

El plazo de vencimiento para estos métodos es más largo (`PAGOS_MINUTOS_VENCIMIENTO_MANUAL`,
por defecto **1440 minutos**, un día): una clienta que va a pagar en la tienda necesita más
de media hora.

## 5. Arquitectura del módulo

```text
modules/pagos/
├── pagos.module.ts
├── controller/pagos.controller.ts        # sesión, instrucciones, webhook, confirmar, expirar
├── dto/                                   # crear-sesion.dto.ts, confirmar-pago.dto.ts, pago-response.dto.ts,
│                                          # instrucciones-response.dto.ts
├── entities/pago.entity.ts                # tabla `pagos`
├── exception/                             # VentaNoPagableException (409), PagoDuplicadoException (409),
│                                          # FirmaWebhookInvalidaException (400), PasarelaNoConfiguradaException (503)
└── service/
    ├── pagos.service.ts                   # orquesta; dueño de la máquina de estados del pago
    ├── expiracion.service.ts              # la barrida de vencidas, aislada y probable sola
    └── pasarela/
        ├── pasarela.interface.ts          # crearSesion(...) / verificarEvento(cuerpo, firma)
        ├── stripe.pasarela.ts             # única implementación real
        └── simulada.pasarela.ts           # para pruebas y para demostrar sin internet
```

`expiracion.service.ts` va aparte a propósito: es la única pieza con reglas de tiempo, y
separada se puede probar con relojes falsos sin arrastrar el resto.

### Entidad

`Pago` extiende `BaseEntity`. Columnas según el diseño: `ventaId` (uuid, columna simple sin
relación — regla 1), `proveedorPago`, `metodo`, `montoCents` (bigint con el transformador a
`number`, como `productos.precioCents`), `estado`, `montoReembolsadoCents`,
`motivoReembolso`, `reembolsadoAt`, `eventId` (**único**), `referenciaExterna`.

**`eventId` es `NOT NULL UNIQUE` y ahí vive la idempotencia.** Para Stripe es el
identificador del evento; para un cobro manual se genera `manual:<uuid>`. Un webhook
reintentado —Stripe reintenta— choca contra el índice único y no cobra dos veces.

## 6. Seguridad

- **El webhook no lleva JWT** (Stripe no puede autenticarse con uno) y por eso **la firma es
  su única defensa**. Se verifica con el secreto de firma contra el **cuerpo crudo**: si el
  cuerpo se parsea antes, la firma no valida nunca. Requiere crear la app con
  `rawBody: true`, un cambio aditivo de una línea en `main.ts` que no afecta al resto.
- **Crear una sesión de pago o ver las instrucciones exige ser el dueño de la venta.** Se
  reutiliza `assertOwnUser` de `core/security/`, el mismo que ya protege el carrito.
- **Confirmar un cobro manual exige `CAJERO` o `ADMIN`** y se guarda quién lo hizo. Sin eso,
  cualquiera podría declarar pagada su propia compra.
- Sin `STRIPE_SECRET_KEY`, el camino de tarjeta responde **503** con mensaje claro; los
  cobros manuales **siguen funcionando**. Mismo criterio que el módulo `ia`: el sistema se
  puede demostrar sin credenciales externas.
- Las claves van en `.env` (ignorado por git). En `.env.example` quedan **vacías**.

## 7. Frontend

- `features/checkout` gana un **selector de método** antes de confirmar el pedido.
- `features/payments/` nuevo: pantalla de instrucciones (QR o aviso de pago en tienda), y el
  regreso de Stripe que consulta el estado real de la venta.
- `features/admin/pages/CobrosAdminPage.tsx`: lista de ventas pendientes de cobro manual, con
  el botón de confirmar. Protegida por el mismo guard de staff que los reportes.

## 8. Pruebas

- **Idempotencia (lo más importante):** el mismo evento de Stripe entregado **dos veces** deja
  una sola fila en `pagos` y una sola transición de la venta. Es la promesa explícita del
  documento entregado.
- **Firma:** un webhook con firma inválida es 400 y **no cambia nada**; uno con firma válida
  aprueba el pago.
- **Un webhook no puede pagar una venta ajena ni una ya cancelada.**
- **Liberación de stock (contra Postgres real, con números calculados a mano):** una venta
  pendiente que vence devuelve exactamente las unidades que el checkout descontó, deja el
  movimiento `AJUSTE` con su motivo, y la venta queda `CANCELADA`. Verificar el inventario
  antes y después.
- **Liberación del cupón:** una venta con cupón que se cancela devuelve el uso
  (`usos_actuales` baja en uno), y una sin cupón no rompe nada. Verificar además que el piso
  es 0: liberar dos veces el mismo cupón no lo deja en negativo.
- **Las dos liberaciones son atómicas:** si la devolución del cupón falla, el stock tampoco
  se devuelve y la venta sigue pendiente. Nada de estados a medias.
- **Expiración:** una venta dentro del plazo **no** se toca; una vencida sí. Con reloj falso.
- **Permisos:** crear sesión sobre una venta ajena es 403; confirmar un cobro siendo
  `CUSTOMER` es 403.
- **Sin clave de Stripe:** el camino de tarjeta es 503 y el manual sigue en 200.
- **Extremo a extremo de los reportes:** una venta digital cobrada **aparece en el reporte de
  ingresos**, que es lo que hoy no ocurre. Cierra el circuito con CU24.

## 9. Impacto en el documento entregado

Al implementar esto, `pagos` se crea y las tablas pasan a **23 de 23**. CU12 gana los pasos
de pago que su flujo hoy no describe (termina en `PENDIENTE`, "pendiente de pago en
pasarela"), y RF19 pasa de pendiente a implementado. Hay que actualizar el capítulo 5, el
apartado 6.7 y la matriz de trazabilidad en `Desktop\mirroria-doc`. **Fuera del alcance de
este plan**, pero no puede quedar sin registrar.

También hay que declarar ahí lo del QR (§3.4): que la confirmación es manual y que mueve
dinero real a una cuenta personal, lo que se aparta de la exclusión de "dinero real" del
capítulo 1.
