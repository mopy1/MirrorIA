# CU24 — Reportes dinámicos por IA (módulo `ia`)

**Fecha:** 2026-09-21
**Estado:** diseño aprobado, pendiente de plan de implementación
**Requisito:** RF25 / CU24 — *Generar Reportes Dinámicos por IA*
**Actores:** `ADMIN`, `ENCARGADO_SUCURSAL` (nunca `CUSTOMER`)

## 1. Problema

`modules/ia/` hoy es un `@Module({})` vacío. El documento entregado del Parcial 1
especifica CU24 paso por paso y compromete un flujo concreto:

> El backend utiliza el LLM exclusivamente para **extracción de intención y parámetros
> estructurados**. El backend ejecuta la consulta SQL paramétrica segura contra los
> repositorios de `ventas` e `inventario` (**el modelo de IA nunca ejecuta SQL directo**).

Además, el backend **no tiene ningún endpoint de reportes**: no existe una sola agregación
(`createQueryBuilder`, `groupBy`) en todo `src/`. `GET /ventas` devuelve la lista completa
de ventas mapeada fila por fila (N+1), útil para una tabla, inservible como reporte.

Es decir, CU24 son dos capas y **ninguna de las dos está construida**.

## 2. Alcance

**Dentro:**

- Módulo `ia` con el motor de consulta paramétrica y el adaptador de LLM.
- Tres endpoints: `POST /api/v1/ia/reportes` (el que el documento ya nombra, pregunta en
  lenguaje natural), `POST /api/v1/ia/reportes/consulta` (ficha armada a mano, sin LLM) y
  `GET /api/v1/ia/interacciones` (historial).
- Persistencia en `interacciones_ia` (la tabla 22 de 23 del diseño).
- Pantalla de administración con entrada por texto y por voz.

**Fuera (decisión explícita, no olvido):**

- Recomendación de productos y chatbot de cliente — fuera de alcance desde el
  2026-09-13, documentado en el vault. `interacciones_ia.tipo` tiene un único valor.
- Gráficos. El resultado se muestra como tabla + narrativa. Un lienzo con series es
  trabajo aparte y no lo pide el CU.
- Los módulos `pagos` y de realidad aumentada, que van por su cuenta.

## 3. Decisiones tomadas

### 3.1 Consulta estructurada, no texto-a-SQL

Se evaluó dejar que el modelo escribiera el `SELECT` (más flexible) y se descartó. El
riesgo determinante **no** es la inyección —que se tapa con un rol de solo lectura— sino
que el modelo produzca una consulta que *corre bien y da un número equivocado*: que sume
ventas `PENDIENTE` junto con `PAGADA`, que duplique filas en un join. Devuelve una cifra
con seguridad total y está mal, y en una defensa eso no se detecta.

El modelo rellena una **ficha** con forma fija; el backend construye la consulta desde esa
ficha con joins y filtros escritos y probados una sola vez.

### 3.2 `estado = PAGADA` por defecto

Las ventas digitales nacen en `PENDIENTE` (`VentasService.checkoutCarrito`) y solo pasan a
`PAGADA` cuando hay cobro — que hoy no existe, porque `pagos` está vacío. Un reporte de
ingresos que no filtre por estado **cuenta como ingreso plata que nadie pagó**. El motor
filtra `estado = PAGADA` salvo que la ficha pida otro estado explícitamente.

### 3.3 Modelo de lectura en `ia` (CQRS, lado de lectura)

La regla 1 del proyecto prohíbe que un módulo importe entidades de otro. Un reporte por
naturaleza cruza lo que la arquitectura separa: `venta_items → variantes → productos →
categorias` son tres módulos, y `inventario_sucursal` deliberadamente no tiene relación
ORM con `catalogo`.

`ia` ejecuta SQL parametrizado de solo lectura vía `DataSource`, **sin importar ninguna
entidad ajena**. El acoplamiento existe pero está en los nombres de tabla, no en el
código, y es unidireccional: nada depende de `ia`. Se documenta como el lado de lectura
de CQRS.

Alternativa descartada: que cada módulo agregara lo suyo y `ia` recompusiera en memoria.
Cumple la regla al pie de la letra pero saca la agregación de SQL y multiplica el código.

### 3.4 Gemini para la extracción

Se usa Gemini por su salida estructurada por esquema (devuelve JSON que cumple el contrato
o falla) y por su capa gratuita. El adaptador queda detrás de una interfaz (`ProveedorIa`)
con una única implementación, para que cambiar de proveedor sea un archivo.

**La clave es propia de este proyecto** (decisión del 2026-09-21): se saca una nueva desde
Google AI Studio a nombre de MirrorIA, en vez de reutilizar la que ya existe en otro
proyecto del usuario. Compartir una clave entre proyectos hace que rotarla o quemarla en
uno rompa el otro. Va en `mirroria-backend/.env` como `IA_API_KEY` — verificado que el
`.gitignore` de la raíz lo cubre (`.gitignore:39`), así que no puede llegar al repo. En
`.env.example` se agrega la variable **vacía y comentada**, nunca con un valor real.

**El sistema funciona sin clave.** Sin `IA_API_KEY`, `POST /ia/reportes` responde 503 con
mensaje claro, porque sin modelo no hay forma de interpretar la pregunta. Pero
`POST /ia/reportes/consulta` **sigue funcionando**: recibe la ficha ya armada, corre la
consulta y devuelve las filas sin narrativa (`narrativa: null`). El motor entero —que es
donde vive la corrección de los números— queda así probable sin red y sin clave.

## 4. El contrato: la ficha de consulta

Decisión del 2026-09-21: la ficha cubre **todos los dominios del negocio**, no solo ventas
e inventario. El objetivo declarado por el usuario es que se le pueda pedir *cualquier*
reporte razonable.

```ts
class FichaConsultaDto {
  metrica: Metrica;
  agruparPor: Dimension;
  filtros: Filtros;
  campoFecha?: 'creacion' | 'prevista';            // solo métricas de reservas (ver 4-bis.2)
  compararCon?: { desde: string; hasta: string };  // segundo período
  orden: 'asc' | 'desc';
  limite: number;           // 1..100, default 20
}
```

### 4.1 Métricas, por dominio

| Dominio | Métrica | Sale de |
|---|---|---|
| Ventas | `ingresos` | `SUM(ventas.total_cents)` |
| | `unidades` | `SUM(venta_items.cantidad)` |
| | `cantidad_ventas` | `COUNT(ventas.id)` |
| | `ticket_promedio` | `AVG(ventas.total_cents)` |
| | `descuentos` | `SUM(ventas.descuento_cents)` |
| Inventario | `stock_disponible` / `stock_reservado` / `stock_en_transito` | `inventario_sucursal` |
| Kardex | `movimientos_unidades` / `movimientos_conteo` | `movimientos_inventario` |
| Reservas | `cantidad_reservas` | `COUNT(reservas.id)` |
| | `unidades_reservadas` | `SUM(reserva_items.cantidad)` |
| Cupones | `canjes_cupon` / `descuento_por_cupon` | `ventas` con `cupon_id` no nulo |
| Compras | `cantidad_ordenes` | `COUNT(ordenes_compra.id)` |
| | `unidades_pedidas` / `unidades_recibidas` | `ordenes_compra.items` (jsonb) |
| Clientes | `clientes_activos` | `COUNT(DISTINCT ventas.cliente_id)` |

### 4.2 Dimensiones

`sucursal`, `categoria`, `producto`, `canal`, `estado`, `cliente`, `cupon`, `proveedor`,
`tipo_movimiento`, `dia`, `mes`, `ninguno`.

### 4.3 Compatibilidad métrica × dimensión

No toda combinación existe: agrupar stock por `dia` no significa nada, porque
`inventario_sucursal` es una foto del presente y no tiene historia. El motor declara una
**tabla explícita de compatibilidad** (métrica → dimensiones y filtros admitidos) y
rechaza lo que no está con 400 y un mensaje que nombra la combinación pedida. Es una
estructura de datos, no una cadena de `if`: agregar una métrica es agregar una fila.

Reglas que salen de ahí:

- Las métricas de **inventario** no admiten dimensión temporal (`dia`/`mes`) ni
  `compararCon`, ni filtros de fecha. Son estado presente. Para la evolución en el tiempo
  está el **kardex**, que sí es histórico — y esa es justamente la diferencia entre los dos.
- `tipo_movimiento` solo aplica a kardex; `cupon` solo a cupones; `proveedor` solo a
  compras; `canal` y `cliente` solo a ventas y cupones.

### 4.4 Filtros

`desde`, `hasta`, `sucursalId`, `categoriaId`, `productoId`, `clienteId`, `proveedorId`,
`canal` (`WEB`|`MOVIL`|`PRESENCIAL`), `estado`, `tipoMovimiento`.

`estado` es **polimórfico**: su juego de valores válidos depende del dominio de la métrica
(`EstadoVenta` para ventas, `EstadoReserva` para reservas, `EstadoOrdenCompra` para
compras). La validación de sus valores ocurre contra el dominio de la métrica, no contra
una lista única.

Validada con `class-validator` **antes** de tocar la base. Una ficha inválida es 400, no
una consulta.

### 4.5 Comparación entre períodos

`compararCon` lleva un segundo rango de fechas. El motor corre **la misma consulta dos
veces** con distinto rango y devuelve ambas series más la variación por fila (absoluta y
porcentual). Correr dos veces la misma consulta, en vez de armar una con dos subconsultas,
mantiene el motor simple y hace imposible que los dos períodos se calculen distinto.

Responde *"¿vendí más que el mes pasado?"*, que es la pregunta que más se hace y la que la
ficha original no podía contestar.

## 4-bis. Trampas de los datos (verificadas en las entidades)

Cinco cosas que el esquema real impone y que hay que respetar o los números salen mal:

1. **`cupones.usos_actuales` NO sirve para reportes.** Es un contador acumulado sin fecha:
   no se puede filtrar por período ni comparar meses. Los canjes se cuentan **desde
   `ventas` agrupando por `cupon_id`**, que sí tiene fecha. Usar el contador daría el mismo
   número para cualquier rango que se pida.
2. **`reservas` tiene dos fechas con significados distintos:** `created_at` (cuándo se hizo
   la reserva) y `fecha_hora_prevista` (cuándo la clienta va a ir a la tienda). Son
   preguntas diferentes. El filtro de fechas usa `created_at` por defecto, y la ficha
   acepta `campoFecha: 'creacion' | 'prevista'` solo para las métricas de reservas.
3. **`movimientos_inventario` tiene columna `fecha` propia**, distinta de `created_at` que
   hereda de `BaseEntity`. El kardex filtra por `fecha`, que es la que el dominio considera
   real.
4. **`ordenes_compra.items` es `jsonb`, no una tabla.** `unidades_pedidas` y
   `unidades_recibidas` necesitan `jsonb_array_elements` para agregar. Es la métrica más
   cara de las 18 y la única que no es un `SUM` sobre una columna.
5. **No existe entidad "cliente":** un cliente es un `usuarios` con rol `CUSTOMER`, y
   `ventas.cliente_id` es nullable (una venta presencial puede no identificar a nadie).
   `clientes_activos` y la dimensión `cliente` **excluyen las ventas sin cliente**, y eso
   se dice en la narrativa — si no, "mis mejores clientes" mostraría un grupo vacío gigante.

## 5. Arquitectura del módulo

```text
modules/ia/
├── ia.module.ts
├── controller/ia.controller.ts          # POST /reportes, POST /reportes/consulta, GET /interacciones
├── dto/                                  # ficha-consulta.dto.ts, prompt.dto.ts, reporte-response.dto.ts
├── entities/interaccion-ia.entity.ts     # tabla interacciones_ia
├── exception/                            # ConsultaNoComprendidaException (422), CombinacionInvalidaException (400)
├── service/
│   ├── ia.service.ts                     # orquesta: extraer → consultar → narrar → registrar
│   ├── motor-consulta.service.ts         # ficha → SQL parametrizado → filas. SIN LLM.
│   ├── catalogo-metricas.ts              # las 18 métricas y su compatibilidad. Datos, no lógica.
│   └── proveedor-ia/
│       ├── proveedor-ia.interface.ts     # extraerFicha(texto) / narrar(ficha, filas)
│       └── gemini.proveedor.ts
```

Sigue la convención de carpeta por capa técnica del proyecto. `motor-consulta.service.ts`
no conoce el LLM y `proveedor-ia` no conoce la base: se prueban por separado.

**`catalogo-metricas.ts` es el corazón del diseño.** Cada métrica se declara como un dato:
de qué tabla sale, con qué agregación, qué joins necesita, qué dimensiones y filtros
admite, y qué columna usa como fecha. El motor es un solo constructor de consultas que lee
ese catálogo — no tiene una rama por métrica. Consecuencias: agregar una métrica es
agregar una entrada y su prueba; el prompt del LLM **se genera desde el mismo catálogo**,
así que nunca puede quedar desfasado de lo que el motor sabe hacer.

### Entidad

`InteraccionIa` extiende `BaseEntity` (id uuid `gen_random_uuid()`, createdAt, updatedAt).
Columnas: `usuarioId` (uuid, columna simple sin relación — regla 1), `tipo`
(varchar 30, default `REPORTE_VOZ`), `inputText` (text, nullable), `outputText` (text,
nullable). Con `synchronize: true` la tabla se crea sola al arrancar: pasa de 21 a 22 de
las 23 del diseño.

## 6. Flujo

```
texto → ProveedorIa.extraerFicha()  → FichaConsultaDto (validada)
      → MotorConsulta.ejecutar()    → filas reales de Postgres
      → ProveedorIa.narrar()        → texto ejecutivo
      → InteraccionIa (persistida)
      → { ficha, filas, narrativa }
```

El modelo entra dos veces y **nunca toca la base**. La respuesta devuelve la ficha
interpretada además de los datos: el usuario ve *cómo* se entendió su pregunta, que es lo
que vuelve auditable al sistema.

**Errores:** si el modelo no logra una ficha válida, 422 `ConsultaNoComprendida` con el
texto original — se registra igual en `interacciones_ia` con `outputText` nulo, porque una
consulta no entendida es dato de producto. Sin clave configurada, 503. Todas las
excepciones extienden `BusinessException` y salen con el shape `{ status, message,
timestamp }` del `GlobalExceptionFilter`.

**Seguridad:** `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN',
'ENCARGADO_SUCURSAL')`, con strings literales (regla de no importar el enum `RolUsuario`
de `seguridad`). `usuarioId` sale de `@CurrentUser()`, nunca del body.

Un `ENCARGADO_SUCURSAL` queda **forzado a su propia sucursal**: el servicio sobrescribe
`filtros.sucursalId` con la sucursal del JWT, ignorando lo que haya pedido. Sin esto, un
encargado pregunta por otra sucursal y el sistema se lo contesta.

## 7. Frontend

`features/reports/` siguiendo el patrón existente (`api/reportsApi.ts` sobre `lib/api.ts`)
y `features/admin/pages/ReportesAdminPage.tsx` registrada en `routes/`, junto a las otras
ocho páginas de `/admin`.

La pantalla: un campo de pregunta, un botón de micrófono, y el resultado en tres partes
— la narrativa, la tabla de datos, y la ficha interpretada en un bloque plegable.

**Voz:** `SpeechRecognition` del navegador (Web Speech API), `lang: 'es-BO'`. Cero
dependencias nuevas y la transcripción ocurre en el frontend, como fija el diseño de BD.
Donde no exista la API, el botón no se muestra y el campo de texto sigue funcionando.

## 8. Pruebas

- **Motor de consulta (unitarias, Vitest, sin red):** **una por cada una de las 18
  métricas**, con datos sembrados de resultado conocido — la prueba compara contra un
  número calculado a mano, no contra lo que devuelva el motor.
- **Las trampas del apartado 4-bis, una prueba cada una:** que los canjes de cupón salgan
  de `ventas` y no del contador (dos períodos distintos dan números distintos); que
  `campoFecha: 'prevista'` dé un resultado distinto a `'creacion'`; que el kardex filtre
  por `fecha` y no por `created_at`; que `unidades_pedidas` agregue bien el `jsonb`; que
  `clientes_activos` excluya las ventas sin cliente.
- **Compatibilidad:** `stock_disponible` agrupado por `dia` → 400; `tipo_movimiento` sobre
  una métrica de ventas → 400; `compararCon` sobre una métrica de inventario → 400.
- **Comparación de períodos:** dos rangos con datos conocidos devuelven ambas series y la
  variación porcentual correcta, incluido el caso de período anterior en cero (no dividir
  por cero: la variación es nula, no infinita).
- **Generales:** `estado = PAGADA` por defecto; `limite` fuera de rango → 400; filtro de
  fechas.
- **Proveedor de IA (unitarias, con doble):** ficha válida; respuesta del modelo que no
  cumple el esquema → 422; sin clave → 503.
- **Endpoint (e2e, Postgres real):** 401 sin token; 403 como `CUSTOMER`; 200 como `ADMIN`;
  `ENCARGADO_SUCURSAL` pidiendo otra sucursal recibe la suya; la interacción queda
  registrada en `interacciones_ia`.

El e2e usa `POST /ia/reportes/consulta` (ficha armada a mano) para no depender del modelo.

## 9. Impacto en el documento entregado

El documento del Parcial 1 declara CU24 como *"📐 Diseñado"* y afirma que al arrancar
contra base vacía se crean 21 de 23 tablas. Al implementar esto pasan a ser **22**, y CU24
pasa a implementado. Hay que actualizar el capítulo 5, el apartado 6.7 y la matriz de
trazabilidad. **Fuera del alcance de este plan**, pero no puede quedar sin registrar.
