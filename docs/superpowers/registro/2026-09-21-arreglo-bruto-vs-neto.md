# CRITICAL residual — el ingreso por categoría es bruto y la siembra lo escondía

Commit **`1bea219`**, rama `ia-reportes`. Un solo hallazgo, acotado. La decisión de agregar con
`SUM(vi.subtotal_cents)` cuando se agrupa por `categoria`/`producto` **no se tocó**: es
correcta. Lo que estaba mal era que su consecuencia no estaba declarada en ningún lado, y
que una siembra imposible hacía pasar una aserción que en producción es falsa.

## El hallazgo, en una línea

`ingresos` significa dos cosas según cómo se agrupe — **neto** sin agrupar
(`SUM(v.total_cents)`, el descuento ya restado) y **bruto** por categoría/producto
(`SUM(vi.subtotal_cents)`, antes del descuento) — y había una prueba que afirmaba que las
dos cifras eran iguales.

Esa prueba sólo cerraba porque `venta1` estaba sembrada con un estado que el sistema no
puede producir: `subtotal_cents = 11000`, `descuento_cents = 1000`, `total_cents = 10000`,
pero líneas por **10000** (6000 + 4000).

Verificado contra el único código que escribe esas columnas,
`src/modules/ventas/service/ventas.service.ts` → `registrarVenta`:

- `subtotalCents += itemSubtotalCents` en el bucle de ítems → `subtotal = Σ subtotales de
  línea`.
- `const totalCents = Math.max(0, subtotalCents - descuentoCents);`

O sea: una venta con `subtotal_cents = 11000` tiene, por construcción, líneas que suman
11000. La siembra vieja era inalcanzable, y con ella `Σ líneas == total` salía cierto por
accidente.

---

## 1. La siembra corregida

`test/motor-consulta.e2e-spec.ts`, INSERT de `venta_items`:

```
-  (gen_random_uuid(), $1, $5, 1, 4000,  4000),   -- venta1 L2, Blusa
+  (gen_random_uuid(), $1, $5, 1, 5000,  5000),   -- venta1 L2, Blusa
```

`venta1` queda con 6000 (Vestidos, var1) + 5000 (Blusas, var2) = **11000 = su
`subtotal_cents`**. `descuento_cents = 1000` y `total_cents = 10000` se mantienen a
propósito: ése es justamente el caso que expone bruto contra neto.

Bonus de consistencia: `precio_unit_cents = 5000` para esa línea coincide con
`productos.precio_cents` de *Blusa Seda* (5000), que es de donde `registrarVenta` saca el
precio unitario. La línea vieja (4000) tampoco era alcanzable por ese lado.

`cantidad` NO cambió (sigue en 1), así que ninguna métrica de unidades se movió.

## 2. La aserción de reconciliación, borrada

Se quitó de *"ingresos por categoria salen de las LINEAS, no del total de la venta"*:

```ts
const suma = filas.reduce((acc, f) => acc + f.valor, 0);
const total = await motor.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: AGOSTO }));
expect(suma).toBe(total[0].valor);
expect(suma).toBe(60000);
```

Es falsa en cuanto una venta real lleve descuento. Su única función era dar una sensación
de seguridad equivocada.

## 3. Los números recalculados, con la cuenta

Todos deducidos de los `INSERT`, no de los comentarios viejos.

### Cambian

| Aserción | Antes | Ahora | Cuenta |
|---|---|---|---|
| `ingresos` por categoría, **Blusas** | 39000 | **40000** | venta1 L2 (5000) + venta2 (30000) + venta5 (5000) |
| `ingresos` por producto, **Blusa Seda** | 39000 | **40000** | mismo conjunto: `prod2` es el único de la categoría Blusas |
| Suma de las categorías (ya no se asevera como igualdad; ahora se asevera como brecha) | 60000 | **61000** | 21000 + 40000 |

### No cambian (verificado uno por uno)

| Aserción | Valor | Por qué no se mueve |
|---|---|---|
| `ingresos` agosto sin agrupar | 60000 | 10000 + 30000 + 5000 + 5000 + 10000, todas cabeceras; `total_cents` de venta1 no se tocó |
| `ingresos` hasta el 2026-08-30 | 50000 | 60000 − venta7 (10000) |
| `ingresos` por categoría, **Vestidos** | 21000 | venta1 L1 (6000) + venta6 (5000) + venta7 (10000); L1 no se tocó |
| `ingresos` por producto, **Vestido Largo** | 21000 | ídem |
| `ingresos` por sucursal | Norte 30000 / Sur 30000 | agrega sobre la cabecera, sin join a líneas |
| `unidades` por categoría | Blusas 7 / Vestidos 5 | `cantidad` de venta1 L2 sigue en 1 |
| `unidades` filtrado a Vestidos | 5 | 2 + 1 + 2, ninguna línea de Vestidos cambió |
| `descuentos` agosto | 1000 | `descuento_cents` de venta1 intacto |
| `ticket_promedio` agosto | 12000 | 60000 / 5 ventas pagadas |
| `cantidad_ventas` por categoría | Vestidos 3 / Blusas 3 | cuenta ventas, no dinero |
| `clientes_activos` | 2 | cuenta clientes distintos |
| comparación agosto vs julio | 60000 / 20000 / +40000 / +200 % | cabeceras |
| kardex, reservas, cupones, compras, stock | sin cambios | no tocan `venta_items` |

Comprobación aritmética hecha en Postgres, replicando las líneas y cabeceras PAGADAS de
agosto tal como quedan sembradas:

```
$ docker exec mirroria_postgres psql -U mirroria -d mirroria_db -c "
WITH lineas(venta, categoria, subtotal) AS (VALUES
  ('venta1','Vestidos',6000),('venta1','Blusas',5000),
  ('venta2','Blusas',30000),('venta5','Blusas',5000),
  ('venta6','Vestidos',5000),('venta7','Vestidos',10000)),
cabeceras(venta, total, descuento) AS (VALUES
  ('venta1',10000,1000),('venta2',30000,0),('venta5',5000,0),
  ('venta6',5000,0),('venta7',10000,0))
SELECT ... ;"

 vestidos_bruto | blusas_bruto | suma_categorias | total_neto | brecha | descuentos
----------------+--------------+-----------------+------------+--------+------------
          21000 |        40000 |           61000 |      60000 |   1000 |       1000
```

La brecha (1000) es exactamente el total de descuentos del período. Ése es el invariante
que reemplaza a la reconciliación falsa.

## 4. La prueba nueva que fija la diferencia

`test/motor-consulta.e2e-spec.ts` → **"el ingreso por categoria es BRUTO: suma mas que el
total del periodo, por el descuento"**.

Corre las tres consultas contra Postgres real y asevera:

```ts
expect(bruto).toBe(61000);
expect(neto).toBe(60000);
expect(bruto).toBeGreaterThan(neto);
expect(bruto - neto).toBe(descuentos[0].valor);   // 1000
expect(descuentos[0].valor).toBe(1000);
```

El comentario de la prueba explica que es bruto contra neto, que la diferencia es el
descuento de cabecera, y que **es esperado, no un defecto** — atribuir el descuento a una
línea exigiría un prorrateo que el negocio nunca declaró.

## 5. Qué quedó declarado, y dónde

1. **`src/modules/ia/service/catalogo-metricas.ts`**, en el doc de
   `DimensionSpec.seleccionAlterna` — bloque "CONSECUENCIA DECLARADA": el ingreso por
   `categoria`/`producto` es **bruto de descuentos** y el de sin agrupar es **neto**, con
   las dos expresiones SQL enfrentadas, el porqué (el descuento vive en la cabecera y no se
   puede atribuir a una línea sin inventar un prorrateo) y el nombre de la e2e que lo fija.
2. **`src/modules/ia/service/catalogo-metricas.ts`**, doc de la constante
   `INGRESO_DE_LINEAS` — una línea: "Es BRUTO de descuentos — el descuento vive en la
   cabecera."
3. **`docs/superpowers/specs/2026-09-21-ia-reportes-design.md`, §4.1** — la fila de
   `ingresos` de la tabla ahora nombra las dos expresiones, y debajo de la tabla hay un
   párrafo que declara bruto vs neto y que sumar las filas por categoría da más que el
   total del período, exactamente por los descuentos.
4. **`mirroria-backend/AGENTS.md`**, sección del módulo `ia` → "Trampas del esquema
   descubiertas al construir el catálogo" — viñeta nueva con lo mismo y el nombre de la
   e2e.
5. **`test/motor-consulta.e2e-spec.ts`**, comentario del INSERT de `venta_items` — por qué
   las líneas de `venta1` suman 11000 y no 10000, citando `registrarVenta`; y que la
   siembra vieja hacía pasar una aserción falsa.

## 6. Corrección del informe previo (`fix-final-report.md`)

**IMPORTANT 1** afirmaba haber encontrado un defecto preexistente: que con `estado: null`
el filtro "se colaba *y además* apagaba el `PAGADA` por defecto, dejando la consulta sin
ningún filtro de estado (o sea, sumando las canceladas)".

**Eso es falso.** Traza del código anterior al commit `ae89812`, con `estado: null`:

1. Bucle de filtros: `if (valor === undefined || …) continue;` → `null !== undefined`, **no
   saltea**.
2. `def.filtros['estado']` existe (`v.estado = $`), así que sigue.
3. `if (nombre === 'estado' && def.estadoValido && !def.estadoValido.includes(String(valor)))`
   → `String(null)` es `"null"`, que no está en `ESTADOS_VENTA` → lanza
   `CombinacionInvalidaException`.
4. `CombinacionInvalidaException` extiende `BusinessException` con
   `HttpStatus.BAD_REQUEST` → **400**.

La consulta nunca se ejecutaba y la línea del estado por defecto nunca se alcanzaba. No
hubo ninguna venta cancelada sumada en producción.

Lo real era otra cosa: el riesgo era una **regresión que el propio arreglo habría
introducido si se corregía sólo la mitad**. Al pasar el bucle a `valor == null`, un
`estado: null` deja de dar 400 y se saltea en silencio; si la comparación del estado por
defecto se hubiera dejado en `=== undefined`, el `PAGADA` tampoco se habría aplicado y *ahí
sí* la consulta habría sumado las canceladas. Se detectó al escribir el arreglo y se fijó
moviendo las dos comparaciones a `== null` en el mismo commit, con prueba unitaria
dedicada. **El código está bien; lo que estaba mal era el texto.**

Se corrigieron en `fix-final-report.md`:

- La viñeta de IMPORTANT 1, con un bloque de cita que explica la traza real y pide
  explícitamente que no se cite el párrafo viejo como evidencia de un bug de producción.
- La fila de la tabla "Antes / Ahora": `filtros.estado: null` pasa de *"sin ningún filtro de
  estado"* a **400 (`"null"` no es un estado válido)**.
- Además, en **CRITICAL 1** se agregó una nota de corrección sobre la fila *"Suma de las
  categorías = el total del período"*, que era la misma falsedad vista desde el otro lado:
  sólo cerraba por la siembra imposible.

El mensaje del commit `ae89812` arrastra la misma afirmación; no se reescribió la historia,
la corrección queda en el informe, que es lo que se lee.

## 7. Lo que NO se tocó

- `SUM(vi.subtotal_cents)` como `seleccionAlterna`: intacta, es la decisión correcta.
- El arreglo de `hasta` (`< $n::date + INTERVAL '1 day'`), el de los `null` y el resto de
  la ola anterior: intactos.
- La línea de `venta3` (`cantidad = 40`, `precio_unit = 2500`, `subtotal = 99999`, que no
  multiplica): **deuda conocida, anotada y no corregida**. Es una venta `PENDIENTE`, ninguna
  aserción la toca, y el filtro `estado = 'PAGADA'` por defecto la deja afuera de todo. Se
  dejó constancia en el comentario del INSERT.

## 8. Verificación

```
$ npm run test
 Test Files  9 passed (9)
      Tests  95 passed (95)
   Duration  3.00s

$ npm run test:e2e
 Test Files  3 passed (3)
      Tests  38 passed (38)
   Duration  4.89s

$ npm run lint
> oxlint src/ test/
(sin hallazgos)

$ npm run build
> nest build
(limpio)
```

Punto de partida: 95 unitarias + 37 e2e. Ahora: **95 unitarias + 38 e2e** (+1, la prueba
nueva de bruto vs neto; la aserción borrada vivía dentro de un `it` que sigue existiendo).

Nada quedó sin cerrar: todos los números recalculados coinciden con la cuenta a mano y con
la comprobación en Postgres.
