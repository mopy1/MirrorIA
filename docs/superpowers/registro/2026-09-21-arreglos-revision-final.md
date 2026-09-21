# Arreglo de los hallazgos de la revisión final — rama `ia-reportes`

Fecha: 2026-09-21. Un commit por hallazgo, en el orden sugerido.

| # | Commit | Hallazgo |
|---|---|---|
| 1 | `4b08d68` | CRITICAL 2 — el filtro `hasta` perdía el último día |
| 2 | `480adcf` | CRITICAL 1 — dinero inflado al agrupar por producto/categoría |
| 3 | `ae89812` | IMPORTANT 1 — un `null` atravesaba la validación |
| 4 | `735651b` | IMPORTANT 2 — `categoriaId`/`productoId` estaban muertos |
| 5 | `46f87c2` | IMPORTANT 3 — la narrativa nunca veía la comparación |
| 6 | `92195b2` | IMPORTANT 4 — datos de clientas hacia un tercero, sin declarar |
| 7 | `d0699dc` | Cobertura — el kardex nunca se sembraba |
| 8 | `7e3723a` | Cobertura — la 2.ª consulta de la comparación |
| 9 | `413404c` | Cobertura — e2e de `ENCARGADO_SUCURSAL` 403 y de `GET /ia/interacciones` |
| 10 | `2dd852b` | Limpieza — `JwtPayload` incompleto en los dobles del spec |

Estado final: **95 unitarias + 37 e2e en verde**, `npm run lint` sin hallazgos,
`npm run build` limpio, y **0 errores de `npx tsc --noEmit` en el módulo `ia`** (bajó de
42 a 10 errores en todo el backend; los 10 que quedan son preexistentes y ajenos: el spec
de `promociones` y el import de `supertest/types` en los tres e2e).

Punto de partida: 71 unitarias + 19 e2e.

---

## CRITICAL 2 — El filtro `hasta` perdía el último día de todo período

**Commit `4b08d68`.**

### Qué cambié

`mirroria-backend/src/modules/ia/service/motor-consulta.service.ts`: el filtro superior
pasa de `${columnaFecha} <= $N` a `${columnaFecha} < ($N::date + INTERVAL '1 day')`, con un
comentario que explica el porqué. Funciona igual para columnas `date` y `timestamp`.

### Qué daba antes y qué da ahora

La raíz del problema, medida directamente en Postgres:

```
$ docker exec mirroria_postgres psql -U mirroria -d mirroria_db -c "SELECT '2026-08-31 16:45:00'::timestamp <= '2026-08-31' AS con_el_viejo_operador, '2026-08-31 16:45:00'::timestamp < ('2026-08-31'::date + INTERVAL '1 day') AS con_el_arreglo;"
 con_el_viejo_operador | con_el_arreglo
-----------------------+----------------
 f                     | t
```

Y contra la base real, con la venta de las 16:45 del 31 de agosto ya sembrada y el motor
todavía sin arreglar:

```
FAIL  test/motor-consulta.e2e-spec.ts > el ultimo dia del rango entra COMPLETO, no solo su medianoche
AssertionError: expected 50000 to be 60000 // Object.is equality
- Expected
+ Received
- 60000
+ 50000
```

Los ingresos de agosto daban **50000**; ahora dan **60000**. Faltaba el día 31 entero.

### La prueba que lo fija

- `test/motor-consulta.e2e-spec.ts` → *"el ultimo dia del rango entra COMPLETO, no solo su
  medianoche"*. Verifica las dos mitades: agosto (hasta el 31) da 60000, y hasta el 30 sigue
  dando 50000 — o sea que el borde se incluye pero no se corre un día de más.
- `src/…/motor-consulta.service.spec.ts` → *"hasta incluye el dia entero, no se corta en su
  medianoche"*, que fija la forma del SQL.
- La siembra: se agregó `venta7` (`2026-08-31 16:45:00`, 10000). Es la **única** venta con
  hora; todas las demás están a medianoche, que era el único instante que el filtro roto
  dejaba pasar — por eso el defecto era invisible. Hay un comentario en el seed que lo dice.
- Totales de agosto recalculados: ingresos 50000→60000, Sucursal Norte 20000→30000, ticket
  promedio 12500→12000 (5 ventas), comparación agosto/julio +30000/+150% → +40000/+200%.

---

## CRITICAL 1 — Números inflados al agrupar dinero por producto o categoría

**Commit `480adcf`.**

### Qué cambié

1. **`DimensionSpec.seleccionAlterna?: string`** (`catalogo-metricas.ts`): una agregación que
   la *dimensión* declara y que **reemplaza** a la de la métrica. El comentario del campo
   explica por qué existe: alcanzar `categoria`/`producto` desde `ventas` obliga a joinear
   `venta_items`, y ese join multiplica cada venta por su cantidad de líneas, con lo cual
   cualquier agregación sobre la **cabecera** queda contada una vez por línea.
2. `ingresos` agrupado por `categoria`/`producto` usa
   `COALESCE(SUM(vi.subtotal_cents), 0)` — el ingreso real de esas líneas, que ya existe en
   la base.
3. **`descuentos` y `ticket_promedio` pierden `categoria` y `producto`.** Su dinero vive en
   la cabecera y repartirlo entre líneas exigiría una regla de prorrateo que el negocio nunca
   declaró. Pedir esa combinación es ahora 400 (`CombinacionInvalidaException`).
4. `motor-consulta.service.ts` usa `dim.seleccionAlterna ?? def.seleccion`.

`cantidad_ventas` y `clientes_activos` quedan como estaban: `COUNT(DISTINCT …)` es inmune al
fan-out. `unidades` ya era correcta.

### Qué daba antes y qué da ahora

El mecanismo del defecto, aislado en Postgres con los números de `venta1` (total 10000 de
cabecera, dos líneas: 6000 de Vestidos y 4000 de Blusas, descuento 1000):

```
$ docker exec mirroria_postgres psql -U mirroria -d mirroria_db -c "
WITH v(id, total_cents, descuento_cents) AS (VALUES ('venta1', 10000, 1000)),
     vi(venta_id, categoria, subtotal_cents) AS (VALUES ('venta1','Vestidos',6000), ('venta1','Blusas',4000))
SELECT vi.categoria,
       SUM(v.total_cents)      AS ingresos_con_el_defecto,
       SUM(vi.subtotal_cents)  AS ingresos_arreglado,
       SUM(v.descuento_cents)  AS descuento_con_el_defecto
FROM v JOIN vi ON vi.venta_id = v.id GROUP BY vi.categoria;"

 categoria | ingresos_con_el_defecto | ingresos_arreglado | descuento_con_el_defecto
-----------+-------------------------+--------------------+--------------------------
 Blusas    |                   10000 |               4000 |                     1000
 Vestidos  |                   10000 |               6000 |                     1000
```

La venta entera contada en las dos categorías, y el descuento de 1000 duplicado (1000+1000).

Contra la base real, con la siembra nueva y el motor revertido a `def.seleccion`:

```
FAIL  test/motor-consulta.e2e-spec.ts > ingresos por categoria salen de las LINEAS, no del total de la venta
AssertionError: expected 25000 to be 21000 // Object.is equality
- Expected
+ Received
- 21000
+ 25000
```

| | Antes | Ahora | Verdad a mano |
|---|---|---|---|
| Ingresos Vestidos (agosto) | 25000 | **21000** | 6000 + 5000 + 10000 |
| Ingresos Blusas (agosto) | 45000 | **39000** | 4000 + 30000 + 5000 |
| Suma de las categorías | 70000 | **60000** | = el total del período |
| `descuentos` por categoría | 2000 y 2000 | **400** | no existe esa cifra |

> **Corrección del 2026-09-21 (ver `fix-critical-residual-report.md`).** La fila "Suma de
> las categorías = el total del período" **sólo cerraba por culpa de la siembra**: `venta1`
> declaraba `subtotal_cents = 11000` pero líneas por 10000, una venta que
> `VentasService.registrarVenta` no puede producir. Con la siembra corregida (líneas por
> 11000), Blusas pasa a **40000** y la suma de categorías a **61000** contra un total de
> **60000**: el ingreso por categoría es **bruto** de descuentos y el ingreso sin agrupar es
> **neto**. La aserción de reconciliación se borró y en su lugar quedó la e2e *"el ingreso
> por categoria es BRUTO"*, que fija la brecha = descuento.

### Las pruebas que lo fijan

- e2e *"ingresos por categoria salen de las LINEAS, no del total de la venta"*: los dos
  números a mano **y** la invariante fuerte — la suma de las categorías tiene que ser igual
  al total del período (60000). Con el fan-out daba 70000 contra un total de 60000.
- e2e *"ingresos por producto tampoco se inflan…"*, *"descuentos y ticket promedio por
  categoria/producto son 400…"* y *"el descuento total de agosto no se duplica…"* (1000).
- Unitarias en `motor-consulta.service.spec.ts`: la agregación que sale en el SQL con y sin
  la dimensión, el 400 de las cuatro combinaciones, y que `cantidad_ventas` sigue siendo
  `COUNT(DISTINCT v.id)`.
- `catalogo-metricas.spec.ts` tiene además una **regla general**, para que una métrica nueva
  no repita el defecto: *"toda dimension que trae venta_items agrega sobre la linea o es
  inmune"* — recorre las 18 métricas y falla si alguna combinación efectiva termina en un
  `SUM(`/`AVG(` sobre `v.`.
- La siembra: `venta1` pasa a tener **dos líneas de categorías distintas** (2 Vestidos por
  6000 + 1 Blusa por 4000 = su total de 10000). Las demás ventas pagadas también llevan
  líneas que suman su cabecera, así los ingresos por categoría **reconcilian** contra el
  total. Unidades por categoría recalculadas: Vestidos 2→5, Blusas 5→7.

---

## IMPORTANT 1 — Un `null` atravesaba la validación y llegaba al SQL

**Commit `ae89812`.**

### Qué cambié

En `motor-consulta.service.ts`:

- El bucle de filtros saltea con `valor == null` (comparación floja: cubre `null` y
  `undefined`).
- El estado por defecto se aplica con `filtros.estado == null` en vez de `=== undefined`.

  > **Corrección del 2026-09-21 (este texto decía otra cosa y era falso).** La versión
  > anterior de esta sección afirmaba que con el código viejo un `estado: null` "se colaba
  > *y además* apagaba el `PAGADA` por defecto, dejando la consulta sumando las canceladas".
  > **Eso nunca pasó en producción.** Con el código anterior, `estado: null` entraba al
  > bucle de filtros (`valor === undefined` es falso para `null`), llegaba a la validación
  > de estado y `String(null)` = `"null"`, que no está en `ESTADOS_VENTA`: tiraba
  > `CombinacionInvalidaException` → **400**. La consulta nunca se ejecutaba y la línea del
  > estado por defecto nunca se alcanzaba.
  >
  > Lo real es otra cosa: el riesgo era una **regresión que este mismo arreglo habría
  > introducido** si se corregía sólo la mitad. Al pasar el bucle a `valor == null`, un
  > `estado: null` deja de dar 400 y se saltea en silencio; si la línea 2 se hubiera dejado
  > en `=== undefined`, el `PAGADA` por defecto tampoco se habría aplicado y *ahí sí* la
  > consulta habría sumado las canceladas. Se detectó al escribir el arreglo y se fijó
  > moviendo las dos comparaciones a `== null` en el mismo commit, con una prueba unitaria
  > dedicada. El código está bien; lo que estaba mal era este informe. No citar este
  > párrafo como evidencia de un defecto preexistente: no lo hubo.
- `params.push(ficha.limite ?? LIMITE_POR_DEFECTO)`, con la constante en el motor, que es
  donde se arma el SQL.

### Qué daba antes y qué da ahora

Las dos premisas, medidas en Postgres:

```
$ docker exec mirroria_postgres psql -U mirroria -d mirroria_db \
    -c "SELECT count(*) AS filas_devueltas FROM (SELECT generate_series(1,500) LIMIT NULL) t;" \
    -c "SELECT (1 = NULL) IS NOT TRUE AS la_condicion_nunca_es_verdadera;"

 filas_devueltas
-----------------
             500

 la_condicion_nunca_es_verdadera
---------------------------------
 t
```

`LIMIT NULL` devuelve las 500 filas: **sin límite**. Y `= NULL` nunca es verdadero.

| | Antes | Ahora |
|---|---|---|
| `filtros.sucursalId: null` + agosto | `v.sucursal_id = NULL` → **0 filas** ("no hubo nada") | 1 fila, **60000** |
| `filtros.estado: null` | **400** (`"null"` no es un estado válido) | `v.estado = 'PAGADA'` |
| `limite: null` | `LIMIT NULL` = sin tope | `LIMIT 20` |

### Las pruebas que lo fijan

- `ficha-consulta.dto.spec.ts` → *"DEJA PASAR null en las propiedades opcionales:
  @IsOptional ignora null"*. Es la prueba de la **premisa**: ese payload es válido y llega
  entero al motor, y `ficha.limite` queda en `null`. Sin ella, el arreglo del motor se lee
  como paranoia.
- `motor-consulta.service.spec.ts` → cuatro pruebas: el filtro nulo no aparece en el SQL ni
  en los parámetros, el estado nulo no desactiva el default, el límite nulo cae a 20, y un
  límite explícito sigue mandando.
- e2e *"un filtro en null no vacia el reporte contra la base real"*: contra Postgres, con
  `sucursalId: null`, `clienteId: null` y `limite: null`, devuelve 1 fila con 60000.

---

## IMPORTANT 2 — Dos filtros del contrato estaban muertos

**Commit `735651b`.**

### Qué cambié

`categoriaId` y `productoId` los admiten ahora **8 de las 18 métricas**, cada una con la
forma que es verdad para ella:

| Métrica | Forma | Significado |
|---|---|---|
| `cantidad_ventas`, `clientes_activos` | `EXISTS` sobre `venta_items` | ventas / clientas que **incluyeron** eso |
| `unidades` | recorte de la propia línea (`vi.variante_id IN …`) | unidades **de** eso |
| `stock_disponible` / `stock_reservado` / `stock_en_transito` | recorte por `i.variante_id` | stock de eso |
| `movimientos_unidades`, `movimientos_conteo` | recorte por `m.variante_id` | movimientos de eso |

`EXISTS` y no `JOIN` por dos motivos: el join multiplicaría la venta por sus líneas (el
fan-out del CRITICAL 1), y el camino hacia el catálogo solo existe cuando la *dimensión* lo
trae — un filtro no puede depender de por qué se agrupa.

Para `unidades` el `EXISTS` **no** sirve: contaría también las unidades de las otras
categorías de esas mismas ventas. Ahí el recorte va sobre la línea.

### Lo que decidí NO ofrecer, y por qué

**`ingresos`, `descuentos` y `ticket_promedio` no reciben estos filtros.** Es el mismo motivo
por el que las dos últimas perdieron las dimensiones `categoria`/`producto`: recortar las
ventas que *tocan* una categoría no convierte el total de cabecera en el dinero de esa
categoría. `ingresos` con `categoriaId: Vestidos` diría 10000 donde la verdad de la categoría
es 6000 — el número inflado del CRITICAL 1, otra vez, por otra puerta. Ofrecerlo hubiera sido
deshacer el arreglo anterior.

La pregunta del hallazgo, *"¿Cuánto vendí de la categoría Vestidos?"*, **sí es expresable
ahora**: `ingresos` agrupado por `categoria` agrega sobre las líneas y da la cifra exacta
(21000 para Vestidos en la siembra). Hay una prueba que deja esa vía escrita justo al lado
del 400.

Tampoco los ofrecen **reservas, compras y cupones**: en compras los ítems son `jsonb` (habría
que hurgar dentro del documento), y en cupones las dos métricas son dinero de cabecera o algo
demasiado angosto para el caso. Quedan fuera a propósito, no por olvido.

**Los filtros por identificador siguen fuera de `ESQUEMA_FICHA`**: el modelo no conoce los
`uuid` de la base. Viven en la vía de ficha manual (`POST /ia/reportes/consulta`). La prueba
que ya existía y lo garantiza (*"el esquema NO le ofrece al modelo los filtros por
identificador"*) sigue pasando sin tocarla.

### Qué daba antes y qué da ahora

Antes, **cualquiera** de estos filtros daba 400 en las 18 métricas. Ahora, contra la base
real (agosto):

| Consulta | Resultado | A mano |
|---|---|---|
| `unidades` + categoría Vestidos | **5** | 2 (venta1 L1) + 1 (venta6) + 2 (venta7) |
| `cantidad_ventas` + categoría Vestidos | **3** | venta1, venta6, venta7 |
| `cantidad_ventas` + categoría Blusas | **3** | venta1, venta2, venta5 |
| `cantidad_ventas` por cliente + producto Vestido Largo | Ana Perez **2**, Luz Rojas **1** | venta1+venta6 / venta7 |
| `stock_disponible` + categoría Vestidos | **7** | var1 en suc1 |
| `stock_disponible` + producto Blusa Seda | **3** | var2 en suc2 |
| `movimientos_unidades` + categoría Vestidos | **3** | mov1 (2) + mov4 (1) |
| `ingresos` / `descuentos` / `ticket_promedio` + categoría | **400** | (ver arriba) |

### Las pruebas que lo fijan

- e2e, bloque *"filtrar por categoria o por producto"*: cinco pruebas con los números de
  arriba. La de `unidades` deja escrito el número que daría el `EXISTS` (6) para que se vea
  por qué ahí va el recorte de línea. La de `cantidad_ventas` prueba que `venta1`, con dos
  líneas, cuenta **una** sola vez.
- Unitarias: la forma del SQL en cada familia (EXISTS / línea / variante propia) y el 400 de
  las seis combinaciones de dinero de cabecera.
- Documentado en `docs/superpowers/specs/2026-09-21-ia-reportes-design.md` §4.4, con la tabla
  de qué métrica acepta qué.

---

## IMPORTANT 3 — La narrativa nunca veía la comparación

**Commit `46f87c2`.**

### Qué cambié

- `ProveedorIa.narrar` toma un tercer argumento: `comparacion?: ComparacionDto | null`, con
  un comentario que dice por qué no es opcional por comodidad.
- `IaService.preguntar` le pasa `reporte.comparacion`.
- `GeminiProveedor.narrar`, cuando la comparación existe, suma al prompt la serie anterior,
  los deltas absolutos y porcentuales y el rango, **y** una instrucción que le pide *nombrar*
  la variación. Un delta porcentual nulo viaja como `"sin base anterior"`: mandar `0%` leería
  como "no cambió nada", que es lo contrario de lo que pasó.

### Qué daba antes y qué da ahora

Antes, lo que viajaba a Gemini para *"¿vendí más que el mes pasado?"* era solo
`Metrica: ingresos. Datos: Total: 60000` — el mes anterior no aparecía por ningún lado, así
que el resumen no podía mencionarlo aunque la tabla lo mostrara. Ahora el mismo pedido lleva
además `Periodo de comparacion (2026-07-01 a 2026-07-31): Total: antes 20000, ahora 60000
(+40000, 200%)` y la instrucción `… El reporte COMPARA dos periodos: nombra la variacion …`.

### Las pruebas que lo fijan

- **`gemini.proveedor.spec.ts` (archivo nuevo)**: mira el **cuerpo que de verdad viaja por la
  red** (intercepta `fetch`), que es lo único que el modelo llega a ver. Tres casos: con
  comparación aparecen `20000`, `40000`, `200%`, el rango y la instrucción; sin comparación el
  prompt no cambia (no se le inventa un período anterior); y el delta nulo sale como
  `"sin base anterior"`, nunca `null%`.
- `ia.service.spec.ts`: que `preguntar` le pase la comparación como tercer argumento, con las
  variaciones correctas, y que sin comparación le pase `null`.
- Documentado en §4.5 del spec.

---

## IMPORTANT 4 — Datos de clientas salen hacia un tercero sin declararlo

**Commit `92195b2`.** No cambia comportamiento: es documentación.

Se agregó a **§3.4 del spec** (`docs/superpowers/specs/2026-09-21-ia-reportes-design.md`) la
subsección *"Qué datos salen hacia Google, y en qué paso"*, y una nota equivalente en
`mirroria-backend/AGENTS.md`. Lo que dicen:

- **Paso 1, `extraerFicha`:** sale la pregunta tal cual la escribió o dictó la usuaria. Nada
  de la base: todavía no se consultó nada.
- **Paso 2, `narrar`:** salen las filas ya calculadas (etiqueta y valor) y, si hay
  comparación, la serie anterior y las variaciones. Las etiquetas **son datos del negocio**, y
  con `agruparPor: 'cliente'` son el **nombre y apellido reales** (`usuarios.full_name`) más
  lo que cada clienta gastó. Un reporte de *"mis mejores clientas"* manda esa lista a la API
  de Google.
- **Lo que no sale:** SQL, filas crudas, `uuid` (la clave de fila se usa solo del lado del
  servidor para casar los dos períodos), correos, teléfonos, contraseñas, JWT.
- **Existe un camino completo sin salida de datos:** la narración es opcional por diseño y
  `POST /ia/reportes/consulta` no toca al proveedor.
- **Pendiente, dicho explícitamente:** el aviso a la usuaria y el respaldo legal del envío. Si
  no se puede sostener, la salida simple es quitar la dimensión `cliente` del paso de
  narración — los números no cambian, porque los calcula el motor.

---

## Huecos de cobertura

### El kardex nunca se sembraba — commit `d0699dc`

`movimientos_inventario` no recibía un solo `INSERT`, así que `movimientos_unidades` y
`movimientos_conteo` no tenían **ningún** número verificado. Lo único que cubría la trampa de
la columna `fecha` propia era una unitaria que compara una **cadena** del catálogo
(`expect(…columnaFecha).toBe('m.fecha')`), que no prueba comportamiento.

Se siembran cuatro movimientos con las dos fechas **desfasadas a propósito**: `mov3` ocurrió
en julio pero se registró en agosto; `mov1` y `mov2` al revés; `mov4` cae el 31 de agosto a
las 18:30 (con lo cual también fija el arreglo de `hasta` sobre una **segunda** columna de
fecha, distinta de `v."createdAt"`).

Números verificados a mano (agosto, por `m.fecha`): conteo **3**, unidades **9** (2+6+1); por
tipo, `VENTA` **3** y `RECEPCION_PROVEEDOR` **6**, y `AJUSTE` no aparece porque es de julio;
julio da **3** unidades (solo `mov3`); por sucursal, Norte **3** y Sur no aparece; filtrado
por categoría Vestidos, **3** unidades.

Que la trampa discrimina de verdad, cambiando el catálogo a `m."createdAt"`:

```
⎯⎯⎯ Failed Tests 4 ⎯⎯⎯
AssertionError: expected 2 to be 3      (conteo de agosto)
AssertionError: expected 4 to be 9      (unidades de agosto)
AssertionError: expected 1 to be 3      (unidades de julio)
AssertionError: expected [ { …(3) }, { …(3) } ] to have a length of 1 but got 2
      Tests  4 failed | 24 skipped (28)
```

Las cuatro pruebas nuevas rompen. La unitaria de la cadena, no.

### La segunda consulta de la comparación — commit `7e3723a`

Nada obligaba a que el segundo período se corriera con `fichaEfectiva`. Se agregó
*"la SEGUNDA consulta usa la MISMA ficha acotada, no la que pidió el usuario"*, que verifica
**ambas** llamadas al motor: que las dos lleven la sucursal del JWT, que sean **literalmente
el mismo objeto** (`toBe`, no `toEqual` — así es imposible que los dos períodos se calculen
con fichas distintas, que es lo que busca la estrategia del §4.5), y que lo único que cambie
entre ellas sea el rango.

Verificado que atrapa la regresión — cambiando `this.motor.ejecutar(fichaEfectiva, …)` por
`ficha`:

```
⎯⎯⎯ Failed Tests 1 ⎯⎯⎯
AssertionError: expected '22222222-2222-2222-2222-222222222222' to be '11111111-1111-1111-1111-111111111111'
      Tests  1 failed | 20 passed (21)
```

Antes de esta prueba, ese mismo cambio dejaba las 90 pruebas en verde.

### `ENCARGADO_SUCURSAL` y `GET /ia/interacciones` por HTTP — commit `413404c`

- **403 sin sucursal asignada por HTTP real.** El rol pasa el `RolesGuard` (está en
  `@Roles`), así que el 403 solo puede venir de `SinSucursalAsignadaException` dentro del
  servicio. Se verifica además que el mensaje hable de la sucursal (no el 403 genérico del
  guard) y que no vengan filas.
- **`GET /ia/interacciones`:** 401 sin token, 403 con `CUSTOMER`, el alcance por rol (un
  encargado ve solo las propias, un ADMIN las de todos) y que por la red salga el DTO y no la
  entidad cruda (sin `usuarioId` ni `updatedAt`) — contra el **repositorio real**, no uno
  simulado. Las interacciones se insertan directo porque sin `IA_API_KEY` no hay forma de
  crear una por HTTP (`POST /ia/reportes` corta en 503 antes de registrar); lo que se prueba
  acá es la lectura.
- El helper de promoción de rol se generalizó a `usuarioConRol(app, role, sucursalId = null)`
  para poder construir una cuenta con rol y **sin** sucursal, y devuelve también el `id`.

---

## Lo que dejé sin arreglar, y por qué

1. **`ingresos` / `descuentos` / `ticket_promedio` no aceptan `categoriaId`/`productoId`.**
   Decisión, no omisión: con `EXISTS` devolverían el total de cabecera de las ventas que tocan
   la categoría, que es el número inflado del CRITICAL 1 por otra puerta. La pregunta se
   contesta exacto agrupando `ingresos` por `categoria`. Está documentado en el catálogo, en
   §4.4 del spec y fijado con pruebas.
2. **Reservas, compras y cupones tampoco aceptan esos filtros.** En compras los ítems son
   `jsonb` y habría que hurgar dentro del documento; en cupones las métricas son dinero de
   cabecera. Fuera de lo que el hallazgo pedía ("hacelos funcionar donde tenga sentido").
3. **El aviso a la usuaria y el respaldo legal del envío a Gemini.** El hallazgo pedía
   declararlo, no resolverlo, y eso hice. Queda anotado como pendiente en el spec y en
   `AGENTS.md`, con la salida técnica si no se sostiene.
4. **`clientes_activos` + filtro de categoría no tiene un número e2e que discrimine.** La
   siembra tiene dos productos, uno por categoría, y las dos clientas compraron de las dos:
   filtre por lo que filtre, el resultado es 2. La cobertura ahí es la forma del SQL
   (unitaria). Se arregla agregando una tercera clienta al seed; no lo hice para no inflar más
   la siembra en esta tanda.
5. **Errores preexistentes de `npx tsc --noEmit` fuera del módulo `ia`**: el spec de
   `promociones` (2) y el import de `supertest/types` en los tres e2e (3). Excluidos
   explícitamente del encargo. Los 16 del módulo `ia` sí los cerré (`2dd852b`), porque mis
   pruebas nuevas heredaban el mismo defecto.
6. **`ia.controller.ts`, `forzarAlcance` y `AdminRoute.tsx`**: no se tocaron, como se pidió.
7. **`mirroria-backend/tsconfig.build.tsbuildinfo` y `mirroria-frontend/package-lock.json`**
   quedan modificados en el árbol de trabajo. Ya venían así antes de empezar; no se
   commitearon.
