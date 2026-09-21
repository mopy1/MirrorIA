# SDD ledger — plan: docs/superpowers/plans/2026-09-21-ia-reportes.md

Spec: docs/superpowers/specs/2026-09-21-ia-reportes-design.md (leída, es la autoridad)
Rama: ia-reportes. Base de la rama: 2488f1b (main). Línea base de pruebas: 7 en 2 archivos.

## Barrido previo

### Pares de tareas que comparten archivo o interfaz

| Tareas | Produce → consume | Hallazgo |
|---|---|---|
| 2 → 8,9,10,11,12 | unión `Metrica`, `DefinicionMetrica`, `DIM_NINGUNO`, `ESTADOS_VENTA`, `dimensionesDeVentas()`, `FILTROS_VENTAS` | **CONFLICTO**: T8 dice extender la unión `Metrica`; T9-T12 agregan entradas a `CATALOGO_METRICAS` sin decirlo. `Record<Metrica, DefinicionMetrica>` no compila. |
| 2 → 4 | `CATALOGO_METRICAS`, `NombreFiltro`, `DimensionSpec` | ok |
| 4 → 5, 13 | `FilaReporte` | ok |
| 4 → 9 | bloque de fechas del motor, reemplazado entero | ok, T9 da el bloque completo |
| 5 → 13, 15, 16 | `IaService` pasa de 1 a 3 argumentos de constructor | ok — T15 avisa explícitamente de actualizar los tests de T5 y T13 |
| 5 → 13 | `ReporteResponseDto.comparacion`: `unknown` → `ComparacionDto` | ok |
| 5 → 15, 16 | `ia.controller.ts`, incremental | ok |
| 1 → 5 → 15 | `ia.module.ts`, incremental | ok |
| 14 → 15 | `PROVEEDOR_IA`, `ESQUEMA_FICHA`, `construirInstruccion` | ok |
| 8, 9, 11 → 14 | "exportado para Task 14" | inexacto: T14 no consume `TIPOS_MOVIMIENTO`. Sin efecto. |
| 3 → 4, 15 | `FichaConsultaDto`, `CombinacionInvalidaException` | ok |
| 17 → 19, 20 | `reportsApi`, tipos de `reports.types.ts` | ok |
| 18 → 19, 20 | `ReportesAdminPage` (stub → real) | ok |

### Consistencia interna de cada tarea

Tasks 1-7, 13-21: el texto concuerda consigo mismo (los tests que especifica contra el
código que especifica; los archivos que crea contra los que después toca).
Tasks 8-12: ver el conflicto de arriba; el resto concuerda.

### Hallazgos del entorno (del repo, no del plan)

- **E1** Sin `node_modules` en las tres apps (clon recién hecho). RESUELTO: `npm install`
  en `mirroria-backend`, 7 pruebas de línea base en verde.
- **E2** El `.env` raíz traía `POSTGRES_PASSWORD=changeme`, pero `mirroria-backend/.env`
  espera `mirroria_password123`. La base nunca habría conectado. RESUELTO: `.env` raíz
  corregido y volumen recreado. `pgcrypto` confirmada.
- **E3** **`JwtPayload` es `{ sub, email, role }` — NO tiene `sucursalId`.** Todo el
  forzado de alcance por sucursal (spec §6; Tasks 5, 13, 15, 16) depende de
  `user.sucursalId`. Ver Ruling R2.
- **E4** Node es v22.23.2, `AGENTS.md` dice 24. `fetch` global existe desde Node 18, así
  que el adaptador Gemini de T15 no se ve afectado. Sin acción.

## Rulings

Ruling R1: cada una de las Tasks 9, 10, 11 y 12 debe extender también la unión `Metrica`
con las métricas que agrega, no solo el objeto `CATALOGO_METRICAS` — el plan solo lo dice
en la Task 8. Motivo: `Record<Metrica, DefinicionMetrica>` no compila con claves que no
estén en la unión. Se lleva en el dispatch de cada una. Si me equivoco: error de
compilación inmediato y obvio, arreglo trivial.

Ruling R2: agregar `sucursalId: string | null` a `JwtPayload`, devolverlo desde
`JwtStrategy.validate()` y sumarlo al payload que firma `AuthService`. Se pliega a la
Task 5, que es donde primero se consume. Motivo: `validate()` ya carga el `Usuario`
completo de la base en cada request y la entidad ya tiene `sucursalId`, así que es
reponerlo, no inventarlo — y los tokens ya emitidos siguen valiendo, porque `validate()`
lo repone desde la base aunque el token no lo traiga. Alternativa descartada: que `ia`
consultara `usuarios` por SQL en cada reporte, que suma una consulta por request y
esconde una regla de seguridad dentro del read model. Si me equivoco: se tocan 3 líneas
de un módulo de Leonardo (`seguridad`), reversible y sin cambio de comportamiento para
nadie más.

Ruling R3: la afirmación del plan de que `TIPOS_MOVIMIENTO` se exporta "para Task 14" es
inexacta — T14 no lo consume. Sin acción: queda exportado como documentación de los
valores válidos. Si me equivoco: una constante exportada sin uso, inocua.

Ruling R4: Node v22 en vez de v24. Sin acción. Si me equivoco: `npm run build` lo diría.

## Progreso
- E5 (resuelto en barrido): `Sparkle` y `Microphone` de @phosphor-icons/react EXISTEN
  (verificado en dist/csr). Tasks 18 y 20 no tienen conflicto de iconos.
- Frontend: `npm install` hecho (374 paquetes, 0 vulnerabilidades), `tsc --noEmit` limpio
  como línea base.

Task 1: despachada (haiku), BASE=8ea5f0b
Task 1: implementada (b3e57b1, 10 pruebas verdes), en revision
Nota: mirroria-backend/tsconfig.build.tsbuildinfo esta RASTREADO por git y se
  modifica en cada build -> ensucia todos los diffs. Los implementadores commitean
  rutas especificas, asi que no entra. No se toca el .gitignore de Leonardo.
Task 1: complete (commits 8ea5f0b..b3e57b1, review clean)
Task 2: despachada (haiku), BASE=b3e57b1
Ruling R5: las Tasks 10, 11 y 12 se despachan JUNTAS en un solo subagente. Motivo: son
  el mismo tipo de edicion (agregar entradas al catalogo de metricas y un bloque describe
  al mismo spec), sobre los mismos dos archivos, sin juicio propio que las separe; una
  tarea por dispatch haria que tres agentes re-lean el mismo archivo grande. Las Tasks 8 y
  9 van solas: la 8 estrena el patron de un dominio nuevo y la 9 modifica el motor. Si me
  equivoco: la revision del lote es mas dificil de aislar y habria que separar los
  hallazgos por tarea a mano.
Task 2: implementada (b04b462, 15 pruebas verdes), en revision (sonnet). Se le pidio
  verificar contra las entidades reales que los nombres de tabla/columna del catalogo
  existen: un nombre mal escrito rompe en ejecucion y las pruebas con repo simulado no
  lo detectan.
R4 confirmado: `npm run build` (nest build) compila limpio bajo Node v22.23.2. La
  diferencia con el Node 24 que declara AGENTS.md no afecta nada.
Ruling R6 (CRITICAL, hallazgo del revisor de T2, verificado por mi contra
  information_schema): la columna es "createdAt" en camelCase, NO created_at. BaseEntity
  usa @CreateDateColumn sin name: y el proyecto no configura namingStrategy, asi que
  TypeORM crea la columna con el nombre de la propiedad. Postgres pliega a minusculas los
  identificadores sin comillas -> `v.created_at` rompe en EJECUCION y las pruebas con
  repositorio simulado no lo ven. Decidido: se usa `v."createdAt"` entre comillas dobles.
  Corregido en el PLAN (origen del defecto, 22 ocurrencias), agregado a las Restricciones
  Globales, briefs 2/9/10/12 regenerados, commit 883a6ca. Task 2 entra en ronda de
  arreglo. Si me equivoco: el motor no devolveria filas al filtrar por fecha.
  Verificado: el resto de las columnas (total_cents, fecha_hora_prevista, full_name,
  fecha_pedido, fecha) SI llevan name: explicito y son snake_case.
Task 2: minor (deferred): COUNT(DISTINCT v.id) sin COALESCE (COUNT nunca es NULL, inocuo)
Task 2: minor (deferred): las pruebas de PAGADA-por-defecto y de inventario verifican una
  metrica representativa, no las 5 de ventas ni las 3 de stock
Verificado por adelantado para T11: `ordenes_compra.items` es jsonb y TypeORM serializa
  la interfaz OrdenCompraItem tal cual -> las claves SON camelCase (varianteId,
  cantidadPedida, cantidadRecibida), como asume el plan. Confirmado en
  inventario/entities/orden-compra.entity.ts. No hace falta la verificacion manual que
  el plan pedia en T11.
Verificado para T12: usuarios.full_name existe tal cual (snake_case, name: explicito).
Task 2: fix round 1/5 despachado (resume del implementador), FIX_BASE=b04b462
Ruling R7 (CRITICAL, lo encontre yo adelantandome a T11): `proveedores` NO tiene columna
  `nombre` — tiene `razon_social`. El plan usaba `pr.nombre` para etiquetar la dimension
  proveedor. Mismo tipo de error que R6 y misma consecuencia: rompe en ejecucion, invisible
  para las pruebas con doble. Corregido en el plan (linea 1672) y brief 11 regenerado,
  ANTES de despachar la tarea. Si me equivoco: la dimension proveedor no etiquetaria.
Verificacion completa de nombres reales hecha contra information_schema para TODAS las
  tablas que tocan las tareas 2 y 8-12. Unicos nombres camelCase: createdAt/updatedAt.
  Confirmados OK: variantes_producto.producto_id, venta_items.venta_id/variante_id/cantidad,
  productos.categoria_id/titulo, categorias.nombre, sucursales.nombre, usuarios.full_name,
  cupones.codigo, movimientos_inventario.fecha/tipo_movimiento, ordenes_compra.fecha_pedido,
  reservas.fecha_hora_prevista, reserva_items.reserva_id/cantidad.
Task 2: fix round 1/5 (1 addressed, 0 open — created_at -> "createdAt" en los 9 sitios,
  con prueba que lo fija; commits b04b462..1117070)
Task 2: complete (commits b3e57b1..1117070, review clean)
Ruling R8 (IMPORTANT, lo encontre yo antes de T3): el ValidationPipe GLOBAL de main.ts es
  `{ whitelist: true, transform: true }` — NO tiene forbidNonWhitelisted. El plan afirmaba
  que si. Sin el, una propiedad inventada por el modelo se DESCARTA EN SILENCIO en vez de
  dar 400, y la ficha deja de ser cerrada. Decidido: ValidationPipe propio del controller
  de `ia` (alcance de ruta), NO tocar el global. Motivo: cambiar el global afectaria todos
  los endpoints de la app de Leonardo y podria romper clientes que hoy mandan campos de
  mas. Se lleva en el dispatch de la Task 5. Comentario del plan corregido y brief 3
  regenerado. Si me equivoco: el alcance de ruta es mas verboso que el global.
Task 3: despachada (haiku), BASE=2210739
Task 3: implementada (52693c7, 22 pruebas verdes), DONE_WITH_CONCERNS: cambio
  `filtros: FiltrosDto = {}` por `new FiltrosDto()` alegando que @ValidateNested con
  forbidNonWhitelisted necesita instancia, no objeto plano. En revision (sonnet), se le
  pidio dictaminar si el argumento es correcto y si `new FiltrosDto()` comparte estado
  entre peticiones.

Ruling R9 (IMPORTANT, hueco de cobertura entre spec y plan, lo detecte yo):
  El spec §8 dice que las pruebas del motor van "con datos sembrados de resultado conocido
  — la prueba compara contra un numero calculado a mano". El plan NO hace eso: las Tasks 4
  y 8-12 simulan `dataSource.query` y aciertan sobre el TEXTO del SQL generado. Eso prueba
  que el SQL se arma como se espera, pero NO prueba que los numeros sean correctos — y es
  exactamente el agujero por el que se colo el bug de created_at en esta misma sesion (la
  suite pasaba en verde con una columna inexistente).
  Como la razon entera de elegir ficha-estructurada sobre texto-a-SQL fue "los numeros no
  pueden salir mal", dejar esto sin cubrir vaciaria la decision de diseno.
  DECIDIDO: se agrega una tarea de integracion al final de la etapa 2 (despues de la Task
  13, cuando existen las 18 metricas) que siembra datos de resultado conocido en Postgres
  real y verifica los numeros contra valores calculados a mano, cubriendo al menos una
  metrica por dominio y la comparacion de periodos. Las pruebas con doble se quedan: son
  rapidas y cubren las combinaciones invalidas.
  Si me equivoco: es una tarea de mas (~1 dispatch) y algo de tiempo de ejecucion; el costo
  de NO hacerla es entregar un sistema de reportes cuyos numeros nadie verifico nunca.
Task 3: complete (commits db34831..52693c7, review clean). Desviacion de `new FiltrosDto()`
  DICTAMINADA JUSTIFICADA: el revisor comprobo empiricamente que con `{}` la prueba de
  ficha minima falla (objeto plano no es instanceof y forbidNonWhitelisted lo rechaza), y
  que el inicializador de campo NO comparte estado entre peticiones.
Task 3: minor (deferred): `DIMENSIONES` es un array escrito a mano en el DTO; si el
  catalogo suma una dimension y nadie toca el DTO, se desincronizan. Contradice el
  principio "el catalogo es la unica fuente de verdad". Defecto de mi plan, no del
  implementador. Triaje en la revision final.
Task 4: despachada (sonnet), BASE=52693c7
Task 4: implementada (b0c1591, 31 pruebas verdes), DONE_WITH_CONCERNS.
  Concern 1: el brief 4 estaba DESACTUALIZADO (yo regenere 2/9/10/12 tras el fix de
    createdAt pero me olvide del 4), asi que una asercion pedia v.created_at. El
    implementador detecto la contradiccion con el catalogo y corrigio la ASERCION, sin
    tocar catalogo ni motor. Correcto. Brief 4 regenerado antes de revisar.
  Concern 2: no registro MotorConsultaService en ia.module.ts — correcto, eso es Task 5.
  En revision (sonnet), con foco en inyeccion SQL, numeracion de parametros $N,
  estado-por-defecto, joins duplicados y conversion bigint->number.
LECCION: al corregir el plan hay que regenerar TODOS los briefs, no solo los que uno cree
  afectados. Los briefs son copias congeladas.
Ruling R10: mi sed del fix de createdAt habia roto 10 literales de TypeScript — metio
  comillas dobles sin escapar dentro de cadenas que ya usaban comillas dobles
  ("date_trunc(...v."createdAt")"). Afectaba a las Tasks 9 y 10, que todavia no se habian
  despachado. Corregido a \"createdAt\" y briefs regenerados. La Task 2 no se vio afectada
  porque su implementador ya habia escapado bien al aplicar el arreglo. Si me equivoco:
  error de compilacion inmediato.
Task 4: revision — pliego cumplido. Los 5 puntos de riesgo que pedi verificar salieron
  CORRECTOS: sin inyeccion SQL (orden se concatena pero solo puede emitir ASC|DESC fijos;
  metrica/agruparPor son claves de un objeto fijo), numeracion $N sincronizada (params.length
  se lee justo despues de cada push), estado-por-defecto bien gateado, joins sin duplicar
  (Set preserva orden, joinsBase primero), y bigint->number con Number().
Task 4: fix round 1/5 despachado — Important: falta guarda de `def` indefinido en
  motor-consulta.service.ts:19-20 (metrica inexistente daria 500 en vez de 400).
  FIX_BASE=b0c1591
Task 4: minor (deferred): la prueba "no duplica un join" no ejercita la deduplicacion real
  del Set, porque el catalogo ya evita la colision de antemano. Heredado de mi pliego.

Ruling R11 (lotes, ampliando R5): se agrupan tareas chicas y acopladas para no gastar un
  dispatch y una revision por cada una. Quedan asi:
    - 5+6+7 juntas (endpoint + su e2e + cierre de etapa 1: el e2e prueba el endpoint que
      crea la 5, y la 7 es solo correr las suites y commitear)
    - 8 sola (estrena el patron de un dominio nuevo)
    - 9 sola (modifica el motor, no solo el catalogo)
    - 10+11+12 juntas (mismo tipo de edicion, mismos dos archivos)
    - 13 sola, 22 sola (los numeros, critica), 14 sola, 15 sola (Gemini), 16 sola
    - 17+18 juntas (tipos/api + ruta/guard del frontend)
    - 19+20 juntas (pantalla + voz, mismo archivo)
    - 21 sola (documentacion)
  De 17 dispatches restantes a 12. Si me equivoco: una revision de lote es mas dificil de
  aislar y habria que separar los hallazgos por tarea a mano.
Task 4: fix round 1/5 (1 addressed, 0 open — guarda de metrica inexistente con prueba que
  exige que query NO se llame; commits b0c1591..5e5ca3a)
Task 4: complete (commits 52693c7..5e5ca3a, review clean)
Lote 5+6+7: despachado (sonnet), BASE=5e5ca3a

Ruling R12 (CRITICAL — AGUJERO DE SEGURIDAD EN MI PROPIO PLAN, lo levanto el implementador
  del lote 5+6+7): la prueba se llamaba "un ENCARGADO_SUCURSAL sin sucursal asignada no ve
  nada de otras" pero asertaba `filtros.sucursalId` === undefined. Sin filtro, el motor
  devuelve TODAS las sucursales: la asercion imponia exactamente lo contrario de su nombre,
  o sea una escalada de privilegios escrita como prueba.
  DECIDIDO: un ENCARGADO_SUCURSAL sin sucursal asignada recibe 403
  (SinSucursalAsignadaException, nueva, extiende BusinessException) y el motor NO se llama.
  Motivo: es una cuenta mal configurada (UsuariosService ya exige sucursalId al asignar ese
  rol), y ante la duda no se muestra nada en vez de mostrarlo todo. Plan corregido: nueva
  excepcion, forzarAlcance corta, y la prueba ahora exige el 403 y que el motor no se llame.
  Si me equivoco: un encargado mal configurado ve un 403 en vez de un reporte vacio, que es
  el fallo barato; al reves era el caro.
Lote 5+6+7: implementado (d36f3e2, 44050c1, d8eac46) + arreglo de seguridad (0c59a58).
  36 unitarias + 5 e2e en verde, lint limpio. En revision completa (sonnet).
Lote 5+6+7: complete (commits 5e5ca3a..0c59a58, review clean). ETAPA 1 CERRADA: 36
  unitarias + 5 e2e, 22 tablas, el reporte anda de punta a punta por HTTP sin IA.
  El revisor verifico el mecanismo del ValidationPipe leyendo el fuente instalado de
  @nestjs/common, y corrio npm run build por su cuenta para descartar rotura por el campo
  nuevo de JwtPayload. El comentario de advertencia en el controller esta y es extenso.
Lote 5+6+7: minor (deferred): falta caso e2e de ENCARGADO_SUCURSAL sin sucursal (403 por
  HTTP real). Cubierto a nivel unitario. OJO en la revision final: es justo el agujero que
  yo habia escrito mal, asi que conviene triarlo con ganas.
Task 8: despachada (haiku), BASE=0c59a58
Task 8: implementada (d4c3982, 40 pruebas verdes), en revision (haiku).
Task 8: complete (commits 0c59a58..d4c3982, review clean)
Task 9: despachada (sonnet), BASE=d4c3982
Task 9: implementada (7b97648, 44 unitarias + 5 e2e verdes), en revision (sonnet).
  Nota: reporto 3 errores PREEXISTENTES de `npx tsc --noEmit` ajenos a la tarea (mocks de
  TypeORM en promociones.service.spec.ts y tipos de supertest en los e2e). `npm run build`
  (nest build) SI compila limpio porque no incluye los spec. No es regresion nuestra.
Task 9: complete (commits d4c3982..7b97648, review clean). El revisor verifico linea por
  linea que el cambio al motor no se filtrara fuera del bloque de fechas, incluida la
  numeracion de $N.
Lote 10+11+12: despachado (sonnet), BASE=7b97648
Lote 10+11+12: implementado (b8ca180, 9d36fd6, 7370c6f), 53 pruebas verdes. DUDA del
  implementador pasada a revision sin prejuzgar: `clientes_activos` mete dos condiciones
  distintas dentro de `filtroEstadoPorDefecto` ("estado PAGADA AND cliente_id IS NOT NULL"),
  y el motor descarta el defecto ENTERO si la ficha trae un estado explicito.
  LOS 7 DOMINIOS DEL CATALOGO COMPLETOS (18 metricas).
Lote 10+11+12: complete (commits 7b97648..7370c6f, review clean). Dictamen del revisor
  sobre filtroEstadoPorDefecto: NO da numeros equivocados — COUNT(DISTINCT) ya ignora los
  NULL por semantica SQL, y la dimension `cliente` usa INNER JOIN a usuarios, que excluye
  las ventas anonimas por si solo. Queda como Minor.
Lote 10+11+12: minor (deferred): el comentario de catalogo-metricas.ts:421 atribuye la
  proteccion al filtro cuando en realidad la dan COUNT(DISTINCT) y el INNER JOIN. Un
  comentario que explica MAL el mecanismo es peor que ninguno: alguien podria sacar el join
  creyendose cubierto. Vale corregirlo en el triaje final.
Lote 10+11+12: minor (deferred): definicionCupones reimplementa inline las dimensiones
  sucursal y mes que ya existen en dimensionesDeVentas(). Transcripcion literal de mi
  pliego, no decision del implementador.
Lote 10+11+12: minor (deferred): falta prueba dedicada de `unidades_recibidas` simetrica a
  la de `unidades_pedidas` (comparten funcion, pero es una rama sin cobertura directa).
Task 13: despachada (sonnet), BASE=7370c6f
Task 13: complete (commits 7370c6f..b4f966d, review clean). ETAPA 2 CERRADA: 57 unitarias
  + 5 e2e, 18 metricas en 7 dominios. El revisor confirmo que AMBAS llamadas al motor usan
  la ficha ya acotada (si la segunda usara la original, un encargado veria otras sucursales
  en el periodo de comparacion).
Task 13: minor (deferred): las variaciones solo recorren las filas del periodo ACTUAL, asi
  que una clave que existia antes y desaparecio (una sucursal que dejo de vender) no se
  reporta como caida a 0. Es lo que pedia mi pliego; hueco de producto, no defecto.
Task 13: minor (deferred): los JwtPayload de prueba no traen `email`; no rompe build ni
  lint (los spec quedan fuera de tsconfig.build) pero ensucia tsc --noEmit.
Task 22: despachada (sonnet), BASE=4c805ce. ES LA TAREA CLAVE: verifica los NUMEROS.
Task 22: implementada (74ede5c). 13 pruebas nuevas, 18 e2e en total, DOS corridas
  seguidas con resultado identico. NINGUN defecto en catalogo ni motor: los numeros
  salieron correctos a la primera contra Postgres real. El implementador encontro que MI
  siembra interpolaba un uuid dentro del literal jsonb, violando la regla global de SQL
  parametrizado; lo paso a $5::jsonb. En revision (sonnet).
Ruling R13 (CRITICAL, hallazgo del revisor de T22, defecto de MI siembra): la prueba
  "clientes activos no cuenta la venta sin cliente" NO aislaba la trampa. La unica venta
  sin cliente era tambien la unica PENDIENTE, asi que el filtro de estado ya la excluia: un
  motor que jamas filtrara por cliente daria el mismo 2. Y como cada cliente aparecia en
  una sola venta pagada, un COUNT(v.id) tambien daria 2 — ni siquiera se probaba el
  DISTINCT. Una prueba de integracion que pasa por el motivo equivocado es peor que no
  tenerla: da confianza falsa justo donde mas se necesita.
  DECIDIDO: sembrar dos ventas mas en agosto (una PAGADA sin cliente y otra de un cliente
  que ya tenia una), de modo que haya 4 ventas pagadas y 2 clientes distintos. Asi
  COUNT(v.id) daria 4 y solo COUNT(DISTINCT cliente_id) da 2. Se recalculan ingresos
  (50000), por sucursal (Norte 20000), ticket promedio (12500) y la comparacion (+150Ruling R13 (CRITICAL, hallazgo del revisor de T22, defecto de MI siembra): la prueba
  "clientes activos no cuenta la venta sin cliente" NO aislaba la trampa. La unica venta
  sin cliente era tambien la unica PENDIENTE, asi que el filtro de estado ya la excluia:
  un motor que jamas filtrara por cliente daria el mismo 2. Y como cada cliente aparecia
  en una sola venta pagada, un COUNT de filas tambien daria 2 — ni siquiera se probaba el
  DISTINCT. Una prueba de integracion que pasa por el motivo equivocado es peor que no
  tenerla: da confianza falsa justo donde mas se necesita.
  DECIDIDO: sembrar dos ventas mas en agosto, una PAGADA sin cliente y otra de un cliente
  que ya tenia una, de modo que haya 4 ventas pagadas y solo 2 clientes distintos. Asi
  contar filas daria 4 y solo contar clientes distintos da 2. Se recalculan ingresos
  (50000), ingresos por sucursal (Norte 20000), ticket promedio (12500) y la comparacion
  de periodos (+150%). Si me equivoco: hay que reajustar numeros esperados, que es barato
  y visible al instante.
Task 22: fix round 1/5 despachado, FIX_BASE=74ede5c
Task 22: minor (incluido en la misma ronda por estar ya editando): la prueba del filtro de
  fecha sobre inventario se llamaba "es 400" pero asertaba un toThrow generico, asi que
  habria pasado con cualquier error.
Task 22: minor (deferred): el numero de errores preexistentes de tsc --noEmit que vengo
  repitiendo en los dispatches (4) no es exacto; el informe, aislando con git stash,
  documenta 8. No afecta nada, pero no repetirlo de memoria.
Task 22: fix round 1/5 (2 addressed, 0 open — siembra que aisla la trampa de clientes +
  asercion especifica de la excepcion; commits 74ede5c..4edd421)
Task 22: complete (commits 4c805ce..4edd421, review clean). LOS NUMEROS ESTAN VERIFICADOS
  contra Postgres real: 18 e2e, dos corridas identicas, y el re-revisor rehizo la
  aritmetica de los 4 numeros que cambiaron. Plan sincronizado en cbceabf.
Task 14: despachada (haiku), BASE=cbceabf
Task 14: implementada (45b4669, 60 pruebas verdes). Revision con DOS Important, ambos
  sobre la prueba, no sobre el codigo de produccion:
  1. La "garantia estructural" que cuenta lineas con guion y las compara con la cantidad de
     metricas NO demuestra derivacion: pasaria igual con 18 lineas escritas a mano, porque
     ninguna prueba ejercita construirInstruccion contra un catalogo distinto del real. Es
     congruencia entre dos fotos del estado actual, no causalidad.
  2. Cambiar las vinetas de las reglas de "- " a "*" para que el conteo cerrara deja el
     FORMATO del prompt preso del test: el dia que alguien agregue una regla con la vineta
     natural, el test se rompe por un motivo ajeno a la garantia.
Ruling R14: se cambia la firma a construirInstruccion(catalogo = CATALOGO_METRICAS) para
  que la prueba pueda pasarle un catalogo FALSO y verificar que el texto lo refleja,
  incluido un not.toContain de una metrica real. Eso si prueba causalidad. Se elimina la
  prueba del conteo de lineas (el test que verifica que cada metrica aparezca ya cubre el
  caso de metrica faltante) y las vinetas vuelven a "- ". Se agrega ademas una prueba que
  impide ofrecerle al modelo los filtros por identificador. Si me equivoco: un parametro
  opcional de mas en una funcion interna, inocuo.
Task 14: fix round 1/5 despachado, FIX_BASE=45b4669
Task 14: minor (deferred): el enum de `agruparPor` del esquema sigue siendo una lista
  escrita a mano en vez de derivarse del catalogo — misma clase de riesgo de desfase que la
  tarea combate para `metrica`. Viene de mi pliego. Triaje en la revision final.
Task 14: fix round 1/5 (2 Important + 1 minor addressed, 0 open — derivacion demostrable
  con catalogo falso y not.toContain de metrica real, vinetas restauradas, prueba que
  impide ofrecer filtros por id; commits 45b4669..cbe8119)
Task 14: complete (commits cbceabf..cbe8119, review clean). 61 pruebas.
Task 15: despachada (sonnet), BASE=cbe8119. Es el adaptador de Gemini y el endpoint de
  lenguaje natural. OJO: no hay IA_API_KEY en el entorno, asi que solo se puede verificar
  el camino del 503 y las pruebas con doble; la prueba contra el modelo real la corre
  Santiago cuando saque su clave.
Task 15: implementada (3bb923e, 66 unitarias + 18 e2e). Los 6 puntos de riesgo salieron
  BIEN: la ficha cruda del modelo se valida ANTES del motor (422 sin llamar al motor),
  preguntar() delega en consultar() asi que el forzado de sucursal sigue vigente,
  usuarioId sale del JWT, .env.example con IA_API_KEY vacia, cero dependencias nuevas
  (Gemini por fetch global), y el patron unknown+pipe manual del otro endpoint intacto.
Ruling R15: el implementador cambio el modelo por defecto de gemini-2.0-flash a
  gemini-3.8-flash por su cuenta. NO le crei ni desconfie: lo verifique contra
  ai.google.dev/gemini-api/docs/models. TENIA RAZON — gemini-3.8-flash es GA desde el
  2-sep-2026 y gemini-2.0-flash figura como shut down. Mi plan nacio desactualizado porque
  mi conocimiento llega a mayo 2026. Plan corregido. Si me equivoco: es una variable de
  entorno, se cambia sin tocar codigo.
Task 15: fix round 1/5 despachado, FIX_BASE=3bb923e. Important: generar() devuelve ''
  cuando Gemini falla, y en narrar() ese '' se propaga como la narrativa de un 200
  exitoso — un fallo que se ve como exito. Se pasa a string|null. Ademas, si narrar()
  LANZA, se pierde el registro entero de la interaccion (asimetria con el caso de ficha
  invalida, que si registra): se envuelve en try/catch. Y se agrega el e2e del 503, que el
  revisor argumento bien que SI es verificable sin clave y cubre el cableado real por
  inyeccion de dependencias, no solo la logica.
Task 15: fix round 1/5 (2 addressed + e2e agregado, 0 open; commits 3bb923e..1d5e71d).
  El re-revisor verifico que el null viaja por toda la cadena de tipos sin que quede un
  string en ningun eslabon, que el try/catch envuelve SOLO la narracion (ni el motor ni el
  registro), y que el e2e cubre las DOS mitades: 503 sin clave y 200 del endpoint de ficha
  manual en la misma condicion.
Task 15: complete (commits cbe8119..1d5e71d, review clean). 68 unitarias + 19 e2e.
Task 16: despachada (haiku), BASE=1d5e71d
Task 16: complete (commits 1d5e71d..f9a02a1, review clean, sin hallazgos). 71 unitarias.
  BACKEND TERMINADO: etapas 1, 2 y 3 cerradas. 71 unitarias + 19 e2e.
Lote 17+18: despachado (sonnet), BASE=f9a02a1. Arranca el frontend.
Lote 17+18: complete (commits f9a02a1..0cf6c23, review clean). El revisor verifico los
  tipos del frontend contra el codigo REAL del backend: los tres campos nullable
  (narrativa, comparacion, deltaPorcentual) estan bien tipados. AdminRoute intacto.
Lote 17+18: minor (deferred): Ficha.metrica y Ficha.agruparPor se tipan como `string` en
  el frontend, mientras el backend usa uniones cerradas; y Ficha.filtros es un diccionario
  abierto en vez de campos nombrados. Viene de mi pliego. Importa mas de cara a la Task 19.
Lote 19+20: despachado (sonnet), BASE=0cf6c23
Lote 19+20: complete (commits 0cf6c23..de97019, review clean, sin Critical ni Important).
  El revisor confirmo la comparacion ESTRICTA contra null en deltaPorcentual (un chequeo
  flojo habria mostrado "—" para un 0% legitimo), que el mensaje del backend llega a
  pantalla sin taparse con uno generico, y que el estilo calca el de las otras paginas.
Lote 19+20: minor (deferred): useDictado recrea el reconocedor de voz en cada tecleo,
  porque onTexto no esta memoizado. Viene de mi pliego. Ineficiencia real, no defecto.
SIN VERIFICAR por falta de navegador y de clave: el flujo real pregunta->narrativa en
  pantalla, el 503 visto por un humano, y el dictado con microfono real. Va al informe
  final como pendiente para Santiago.
Task 21: despachada (sonnet), BASE=de97019. Cierre: suites, tablas y AGENTS.md.
Task 21: complete (commit 7bb4028, todo en verde). CIERRE: 71 unitarias + 19 e2e = 90
  pruebas, lint y build limpios en las dos apps, 22 tablas con interacciones_ia presente.
  El implementador detecto que mi brief decia "16 metricas" y conto 18 leyendo el codigo:
  documento 18 en 7 dominios, verificado contra la fuente y no contra mi texto.
  LAS 21+1 TAREAS DEL PLAN ESTAN HECHAS.

== REVISION FINAL DE RAMA (opus) — 2 CRITICAL, 4 IMPORTANT ==
La promesa central se sostiene: ningun texto del modelo llega a la base sin validar y
ningun valor va concatenado. El revisor corrio un barrido de las 18 metricas x todas sus
dimensiones x todos sus filtros contra Postgres real: 0 fallos de nombres. Los controles de
acceso se sostienen en los tres caminos, incluida la comparacion de periodos.
PERO el motivo por el que se eligio esta arquitectura —numeros equivocados que nadie nota—
falla por dos caminos, ambos verificados contra la base real.

CRITICAL 1 (fan-out): `ingresos`, `descuentos` y `ticket_promedio` agrupados por `producto`
  o `categoria` dan numeros INFLADOS. Esas dimensiones hacen JOIN a venta_items, que
  multiplica cada venta por su cantidad de lineas, pero la agregacion es sobre columnas de
  la CABECERA (v.total_cents, v.descuento_cents). El total de una venta se cuenta entero en
  cada categoria que toca y el descuento se duplica. Con una venta de 2 lineas el revisor
  midio: Vestidos 10000 cuando la verdad era 6000 (67% arriba) y descuentos 2000 cuando era
  1000. Ademas el JOIN es INNER, asi que las ventas sin lineas DESAPARECEN del desglose —
  y los dos errores se compensan en el gran total, lo que lo hace aun mas dificil de notar.
  Invisible para las pruebas porque TODAS las ventas sembradas tienen exactamente 1 linea.

CRITICAL 2 (el ultimo dia): el filtro `hasta` emite `columna <= $N` contra columnas
  `timestamp`, y el prompt le pide al modelo fechas en formato YYYY-MM-DD. Entonces
  `hasta: '2026-08-31'` solo incluye lo ocurrido a las 00:00:00 exactas: TODA venta del 31
  de agosto queda fuera del reporte de agosto. En "cuanto vendi este mes" descarta el dia
  de hoy entero. Invisible para las pruebas porque todas las fechas sembradas son a
  medianoche, el unico instante que el filtro si incluye.

IMPORTANT 1: @IsOptional() de class-validator IGNORA null (no solo undefined) y el motor
  solo saltea undefined. Verificado pasando el body por el ValidationPipe real:
  `filtros.sucursalId: null` -> `columna = NULL`, que nunca es verdadero -> el reporte
  devuelve 0 filas y se ve como "no hubo nada"; y `limite: null` -> `LIMIT NULL`, que en
  Postgres significa SIN LIMITE. No es hipotetico: la salida estructurada de Gemini emite
  null de rutina para opcionales que decidio no llenar.
IMPORTANT 2: los filtros `categoriaId` y `productoId` estan MUERTOS — el spec los lista y
  el DTO los valida, pero ninguna de las 18 metricas los declara, asi que siempre dan 400.
  "Cuanto vendi de la categoria Vestidos" es imposible de expresar.
IMPORTANT 3: la narrativa NUNCA ve la comparacion — se le pasan solo las filas del periodo
  actual. El usuario pregunta "vendi mas que el mes pasado", la tabla trae la respuesta y
  la narrativa la ignora. Es el desvio mas visible en una defensa.
IMPORTANT 4: con `agruparPor: cliente`, los NOMBRES REALES de clientas viajan a la API de
  Gemini en el paso de narracion. En un proyecto academico es tolerable, pero no esta
  declarado en ningun lado.

Huecos de cobertura que el revisor nombro: el kardex NUNCA se siembra (sus 2 metricas no
  tienen un solo numero verificado); 9 de 18 metricas sin numero calculado a mano; nada fija
  que la SEGUNDA consulta de la comparacion use la ficha acotada (si alguien la cambia, las
  90 pruebas siguen verdes y un encargado ve otras sucursales); GET /interacciones sin e2e;
  ENCARGADO_SUCURSAL no aparece en ningun e2e; la forma real de la respuesta de Gemini no
  se prueba contra un payload real; y cero pruebas en el frontend.

Ruling R16 (C1, como arreglarlo): para `ingresos` agrupado por producto/categoria se usa
  `SUM(vi.subtotal_cents)`, que es el ingreso real de esas lineas y ya existe en la base.
  Para `descuentos` y `ticket_promedio` se QUITAN las dimensiones producto/categoria:
  el descuento y el total viven en la cabecera de la venta y no se pueden atribuir a una
  linea sin inventar una regla de prorrateo — e inventarla en silencio es exactamente lo
  que este diseno vino a evitar. Mejor no ofrecer la combinacion que ofrecerla mintiendo.
  Si me equivoco: se pierden 4 combinaciones de 18x12, y agregar el prorrateo despues es
  aditivo.
Ruling R17 (C2): `hasta` pasa a `columna < ($N::date + INTERVAL '1 day')`, que funciona
  igual para columnas date y timestamp e incluye el dia entero. Si me equivoco: el borde se
  corre un dia, y la prueba nueva con timestamp de media tarde lo detecta al instante.
Ruling R18 (I4): no se cambia el comportamiento — se DECLARA en el spec y en AGENTS.md que
  las etiquetas del resultado (incluidos nombres de clientas) viajan al proveedor de IA en
  el paso de narracion. Ocultarlo seria peor que el hecho en si. Si me equivoco: es una
  nota de documentacion, se quita.

OLA DE ARREGLO FINAL: los 8 hallazgos cerrados en 10 commits (7bb4028..2dd852b).
  95 unitarias + 37 e2e = 132 pruebas (antes 90). lint y build limpios. tsc del modulo ia
  en 0 errores (el backend entero bajo de 42 a 10, los 10 son preexistentes y ajenos).
  HALLAZGO EXTRA del implementador: el null tambien apagaba el filtro estado=PAGADA por
  defecto, o sea se sumaban las ventas CANCELADAS. Tercer caso que la revision no nombro.
  Y agrego una regla general que recorre las 18 metricas y falla si alguna que se une a
  venta_items termina agregando sobre la cabecera, para que una metrica nueva no repita el
  Critical 1.

== RE-REVISION DE LA OLA FINAL (opus) ==
Los 4 hallazgos abiertos y los 3 huecos de cobertura: TODOS ADDRESSED. El re-revisor rehizo
la aritmetica de las ~30 pruebas nuevas contra los INSERT y TODOS los numeros cierran.
Ademas comprobo que las pruebas discriminan de verdad, inyectando defectos a mano: borro el
seleccionAlterna y la regla general FALLA como debe; revirtio el motor y confirmo el
comportamiento. Verifico tambien que `unidades` no se rompio, que seleccionAlterna no se
aplica de mas, y que el borde `desde` no se movio.

CORRECCION AL INFORME DEL IMPLEMENTADOR (y a lo que yo le repeti al usuario): el "tercer
  caso" del defecto de nulos NO era un defecto preexistente que sumaba ventas canceladas.
  Con el codigo viejo entero, `estado: null` daba 400 porque "null" no esta en estadoValido.
  El defecto real habria sido una REGRESION que el propio arreglo introducia si se corregia
  solo la mitad. El implementador lo detecto y lo fijo con una prueba; el codigo quedo bien,
  pero el relato estaba mal y yo lo repeti. Nunca hubo canceladas sumandose en produccion.

CRITICAL NUEVO (misma clase que el original): el arreglo del Critical 1 cambio `ingresos`
  agrupado por categoria/producto de NETO a BRUTO sin declararlo. Sin agrupar, `ingresos`
  es SUM(v.total_cents), que ya tiene el descuento restado. Agrupado por categoria, es
  SUM(vi.subtotal_cents), que es ANTES del descuento. La misma metrica significa dos cosas
  distintas segun como se agrupe, y el reporte por categoria sobreestima exactamente el
  descuento. Peor: la siembra de venta1 se construyo con lineas que suman 10000 cuando su
  subtotal declarado es 11000 — una venta que la app NO PUEDE PRODUCIR, porque
  VentasService calcula subtotal = suma de lineas. Con datos reales, la prueba que afirma
  "la suma de las categorias = el total del periodo" es FALSA siempre que haya un descuento.
  O sea: un seed imposible haciendo pasar una invariante que en produccion no se cumple.

Ruling R19: se arregla, no se aparca. Es un numero equivocado que nadie nota, que es
  exactamente lo que este proyecto existe para evitar; aparcarlo seria incoherente con
  haber gastado una sesion entera en cazar esta clase de defecto. El arreglo es acotado:
  poner las lineas de venta1 en 6000+5000=11000 (asi la venta es construible por la app),
  borrar la asercion de reconciliacion que es falsa en produccion, ajustar Blusas a 40000,
  y DECLARAR en el catalogo y en el spec que el ingreso por categoria/producto es bruto de
  descuentos. La eleccion de vi.subtotal_cents se mantiene: el prorrateo del descuento era
  peor. Si me equivoco: son numeros de una prueba y un parrafo de documentacion.

Ruling R20: los 4 hallazgos Minor de la re-revision se APARCAN con constancia, no se
  arreglan. (a) `hasta` con hora se ensancha a fin de dia — solo afecta la via de ficha
  manual, al modelo se le piden fechas sin hora; (b) la regla general no cubre COUNT sobre
  cabecera, otros alias, ni reserva_items/jsonb — cubre el caso real de hoy y es mejor que
  no tenerla; (c) la descripcion equivocada del "tercer caso" en el informe — se corrige el
  texto junto con R19; (d) la linea de venta3 (40x2500 != 99999) — es una venta PENDIENTE
  que ninguna asercion toca. Si me equivoco: son huecos conocidos y anotados, no sorpresas.
