# SDD ledger — plan: docs/superpowers/plans/2026-09-21-pagos.md

Spec: docs/superpowers/specs/2026-09-21-pagos-design.md (leída, es la autoridad)
Rama: pagos. Base: b1d4698. Estado heredado: 95 unitarias + 38 e2e en verde, 22 tablas.

## Barrido previo

### Pares de tareas que comparten archivo o interfaz

| Tareas | Produce → consume | Hallazgo |
|---|---|---|
| 1 → 3,4,7,8 | `Pago`, `MetodoPago`, `ProveedorPago`, `EstadoPago` | ok |
| 2 → 3,4 | `VentasService.marcarPagada`, `.cancelarPorPagoNoCompletado`, `PromocionesService.liberarCupon` | ok |
| 3 → 4,7,8 | **`PagosService` crece de 3 a 4 argumentos (T4) y de 4 a 5 (T7)** | CONFLICTO YA RESUELTO en el plan: las dos tareas llevan un aviso explícito de actualizar las pruebas anteriores |
| 3 → 4,7,8 | `pagos.controller.ts` y `pagos.module.ts`, incrementales | ok |
| 3 → 7 | `PasarelaNoConfiguradaException` (la crea la 3, la usa la 7) | ok |
| 6 → 7,8 | `PASARELA`, `Pasarela`, `SesionPago`, `EventoPago`, `FirmaWebhookInvalidaException` | ok |
| 5 → 9 | `test/pagos.e2e-spec.ts` (la 5 lo crea, la 9 lo amplía) | ok |
| 10 → 11,12 | `payments.types.ts`, `paymentsApi` | ok |
| 12 → (plan anterior) | **modifica `StaffRoute`**, que usa la ruta de reportes de CU24 | el plan ya exige ampliarlo por propiedad sin cambiar el comportamiento de reportes |
| 2 → 5 | la devolución de stock y cupón que la 5 verifica con números | ok |

### Consistencia interna de cada tarea

Tasks 1-4, 6-8, 10-13: el texto concuerda consigo mismo.
Task 5: ver ruling P2 — el flujo que describe necesita un paso que no muestra.
Task 9: ver nota de P6.

### Hallazgos verificados contra el código real

- `VentaResponseDto` (en `dto/ventas-response.dto.ts`, plural) tiene `clienteId`, `estado`,
  `totalCents` y `numeroComprobante`: los cuatro campos que la Task 3 le pide a
  `ventasService.findOne`. OK.
- `CarritosService.addItem(usuarioId, dto)` existe, que es lo que la Task 5 necesita para
  sembrar un carrito antes de llamar al checkout.
- `assertOwnUser` existe en `core/security/` y ya lo usan carrito y checkout.
- Las excepciones nuevas resuelven bien sus rutas relativas desde `modules/pagos/exception/`
  y desde `service/pasarela/`.

## Rulings

Ruling P1: la Task 5 llama a `ventas.checkoutCarrito(...)`, pero el checkout falla si el
  carrito está vacío — y la siembra que describe el plan no crea ningún carrito. Decidido:
  la prueba siembra el carrito con `CarritosService.addItem` antes de cada checkout. Se
  lleva en el dispatch de la Task 5. Si me equivoco: la prueba falla con "El carrito está
  vacío", que es inmediato y obvio.

Ruling P2: la Task 8 usa `this.logger` dentro de `PagosService`, que hoy no tiene uno.
  Decidido: agregar `private readonly logger = new Logger(PagosService.name)` al servicio en
  esa tarea. Si me equivoco: error de compilación inmediato.

Ruling P3: la Task 9 sustituye el proveedor `PASARELA` por la simulada en el arranque del
  e2e, y ese archivo ya tiene las pruebas de la Task 5. Decidido: la sustitución se agrega al
  `Test.createTestingModule` existente; las pruebas de la Task 5 no usan la pasarela, así que
  no se ven afectadas. Si me equivoco: fallarían las pruebas de la 5 y se vería al instante.

Ruling P4: `pagos` importa `VentasModule` para inyectar `VentasService`. Eso NO viola la
  regla 1 del proyecto: la regla prohíbe importar entidades y servicios *directamente*, y el
  patrón aceptado —el que ya usan `colecciones` con `proveedores` y `ventas` con `reservas`—
  es inyectar el servicio EXPORTADO del otro módulo. Si me equivoco: habría que pasar por
  eventos, que es mucho más trabajo para el mismo resultado.

## Progreso
Task 1: implementada (cd9793a, 99 unitarias verdes). LAS 23 TABLAS DEL DISENO ESTAN
  COMPLETAS. En revision (haiku).
Task 1: complete (commits b1d4698..cd9793a, review clean, sin hallazgos).
Task 2: despachada (sonnet), BASE=cd9793a
Task 2: complete (commits cd9793a..a964081, review clean). Las tres operaciones comparten
  la misma transaccion, el movimiento es AJUSTE con motivo y cantidad positiva, marcarPagada
  es idempotente sobre PAGADA pero falla sobre CANCELADA, y el revisor confirmo que
  registrarVenta/checkoutCarrito/registrarPresencial quedaron TEXTUALMENTE identicos.
  110 unitarias + 38 e2e.
Task 3: despachada (sonnet), BASE=a964081
Task 3: implementada (138b47e, 119 unitarias + 38 e2e). Tres concerns, ninguno de fondo:
  no pudo probar el curl con una venta de checkout real (base sin catalogo sembrado, inserto
  la venta por SQL), PasarelaNoConfiguradaException queda sin usar hasta la Task 7, y uso un
  servidor dev que habia quedado corriendo de una tarea anterior.
  Yo mate ese servidor colgado (PID 24144): serviendo codigo viejo podia confundir las
  verificaciones manuales de las tareas siguientes.
Task 3: revision — los 5 puntos de riesgo salieron BIEN: la guarda de TARJETA corta antes
  de tocar estado alguno, los permisos salen del JWT y nunca del body, randomUUID da
  unicidad real, no se cobra dos veces, y queda registrado quien confirmo. El revisor
  dictamino que la verificacion por SQL directo prueba lo que dice probar para esta tarea.

Ruling P5 (SUBO la clasificacion de un hallazgo): el revisor marco Minor que
  `save(pago)` y `marcarPagada` corran sin transaccion compartida. Lo subo porque conozco
  lo que viene: la Task 4 agrega una expiracion que CANCELA ventas impagas, y eso vuelve
  alcanzable esta secuencia — la expiracion cancela una venta (su stock ya volvio), el
  cajero confirma el cobro con la pantalla abierta, el pago se guarda APROBADO, y
  marcarPagada lanza porque la venta esta CANCELADA. Queda un cobro aprobado sobre una
  venta cancelada cuyo stock ya se devolvio: el cajero ve un error pero la base dice que
  le pagaron. En un camino de dinero eso no se aparca.
  DECIDIDO: envolver las dos operaciones en una transaccion y pasarle el manager a
  marcarPagada, que justamente lo acepta. El defecto viene de MI pliego, que especifico el
  codigo sin transaccion. Si me equivoco: un argumento mas en el constructor y una prueba
  de mas, ambos inocuos.
Task 3: fix round 1/5 despachado (incluye tambien el minor del event_id: la prueba solo
  verificaba el prefijo, asi que pasaria igual con un valor fijo). FIX_BASE=138b47e
Task 3: fix round 1/5 (2 addressed, 0 open — confirmacion atomica con el manager
  compartido, y prueba de unicidad que compara dos valores entre si; commits
  138b47e..290e4d1)
Task 3: complete (commits a964081..290e4d1, review clean). 121 unitarias + 38 e2e.
Task 4: despachada (sonnet), BASE=290e4d1. OJO: PagosService YA tiene 4 argumentos tras el
  arreglo (repo, ventas, config, dataSource), asi que la Task 4 lo lleva a 5, no a 4 como
  dice el pliego.
Task 4: implementada (b8d13ce, 127 unitarias + 38 e2e). Dos concerns del implementador
  pasados a revision sin prejuzgar: nada asierta que iniciarManual/confirmarManual llamen a
  expirarVencidas (y esa llamada ES el mecanismo, porque no hay planificador), y el endpoint
  nuevo no tiene cobertura directa.
Task 4: fix round 1/5 despachado. CRITICAL confirmado por el revisor: nada asertaba que
  iniciarManual/confirmarManual llamaran a expirarVencidas, y se comprobo que borrando esas
  dos lineas la suite ENTERA queda verde. Como no hay planificador, esas llamadas SON el
  mecanismo de liberacion de stock: borrarlas reintroduce el bug que la tarea vino a
  resolver, en silencio. Se agregan las dos aserciones y ademas el caso de borde exacto
  (hoy nada distingue si la comparacion es < o <=, asi que el plazo se puede correr sin que
  nada rompa). FIX_BASE=b8d13ce
Task 4: minor (deferred): el endpoint POST /pagos/expirar-vencidas no tiene prueba directa
  de su guard de rol ADMIN. Consistente con el resto del controller, que tampoco tiene spec.
Task 4: fix round 1/5 (2 addressed, 0 open; commits b8d13ce..6188598). El implementador
  VERIFICO EL MUTANTE: borro las llamadas y comprobo que las pruebas nuevas fallaran.
  El borde resulto INCLUSIVO (30 minutos exactos vence) y lo fijo sin tocar el servicio.
Task 4: complete (commits 290e4d1..6188598, review clean). 130 unitarias + 38 e2e.
Task 5: despachada (sonnet), BASE=6188598. Es la que verifica los NUMEROS del stock y del
  cupon contra Postgres real.
Task 5: implementada (36bfa29). 43 e2e (antes 38), DOS corridas identicas. NINGUN defecto
  en el codigo de produccion: los numeros coincidieron con la cuenta a mano a la primera.
  SI encontro un defecto de infraestructura de pruebas y lo arreglo: su siembra usaba talla
  M y color Negro, iguales a los de motor-consulta.e2e-spec.ts, y como esas columnas son
  UNIQUE globales y vitest corre los e2e en PARALELO, los INSERT chocaban y tumbaban la otra
  suite de forma no deterministica. Renombrados a M-PAGOS / Negro Pagos.
Task 5: revision — los 5 numeros se deducen de la siembra (el revisor los rehizo uno por
  uno contra el codigo real de registrarVenta y consumirCupon), la limpieza esta verificada
  clave foranea por clave foranea, y el diagnostico del choque de talla/color fue CORRECTO
  Y COMPLETO: el revisor reviso todas las demas columnas UNIQUE compartidas entre los dos
  archivos (slug, sku, codigo de cupon, emails) y ya estaban diferenciadas.
Ruling P6 (CRITICAL, hallazgo del revisor): la prueba "una venta cobrada aparece en el
  reporte de ingresos" PASA POR EL MOTIVO EQUIVOCADO. Consulta sin acotar por sucursal, y
  el motor agrega TODA la tabla ventas; motor-consulta.e2e-spec.ts siembra 5 ventas WEB
  PAGADAS y corre EN PARALELO contra la misma base. Asi que `WEB > 0` es verdadero aunque
  el circuito de cobro este completamente roto. Es la asercion vacia que el pliego pedia
  evitar, con otro nombre — y es peor porque esa prueba es la que supuestamente demuestra
  que cerramos el circuito con los reportes de CU24.
  DECIDIDO: medir el ingreso ANTES y DESPUES de cobrar una venta nueva, acotando por
  sucursalId, y exigir que la diferencia sea EXACTAMENTE el total de esa venta. Las dos
  cosas hacen falta: acotar deja fuera lo del otro archivo, y el delta hace que la prueba
  falle si el cobro no llega a PAGADA. Si me equivoco: la cuenta del delta no cierra y se
  ve al instante.
Task 5: fix round 1/5 despachado (incluye alinear los emails de los dobles de JWT con los
  sembrados, que hoy no coinciden y confunden). FIX_BASE=36bfa29
Task 5: minor (deferred): la prueba del movimiento AJUSTE se apoya en el estado que deja la
  prueba anterior en vez de sembrar el suyo. Funciona por el orden secuencial de vitest
  dentro de un archivo, pero acopla las pruebas entre si.
Task 5: fix round 1/5 (2 addressed, 0 open; commits 36bfa29..646f2dd). La prueba ahora
  acota por sucursal Y mide delta exacto: si el cobro no llegara a PAGADA, antes y despues
  serian iguales y fallaria. El re-revisor encontro un error en la NARRATIVA del informe
  (decia que el valor inicial era 0, cuando una prueba anterior ya deja una venta pagada) —
  no afecta al codigo, y el enfoque de delta es robusto justamente por no asumir eso.
Task 5: complete (commits 6188598..646f2dd, review clean).
  ETAPA 1 CERRADA: el cobro manual anda de punta a punta SIN pasarela, SIN claves y SIN
  internet; el stock y el cupon vuelven solos; 130 unitarias + 43 e2e; 23 de 23 tablas.
Task 6: despachada (haiku), BASE=646f2dd
Task 6: implementada (f235497, 134 unitarias). En revision (haiku).
Task 6: complete (commits 646f2dd..f235497, review clean, sin hallazgos). 134 unitarias.
Task 7: despachada (sonnet), BASE=f235497. OJO: el pliego dice que PagosService pasa de 4 a
  5 argumentos; los reales son 5 -> 6 (repo, ventas, config, dataSource, expiracion, y ahora
  la pasarela).
Task 7: implementada (8e83332, 138 unitarias + 43 e2e). Una sola dependencia nueva
  (`stripe`), claves vacias en .env.example, 503 sin claves con el cobro manual intacto,
  moneda configurable con caida a usd, y nadie puede iniciar el cobro de una venta ajena.
  El revisor VERIFICO LA VERIFICACION: comprobo tres citas de linea del implementador
  contra el SDK realmente instalado (stripe@22.6.2) y las tres coinciden exactamente, asi
  que abrio los archivos de verdad en vez de afirmarlo.

Ruling P7 (CRITICAL — DEFECTO DE MI PLIEGO, no del implementador): `iniciarTarjeta` no
  llamaba a expirarVencidas(). El implementador lo levanto como duda y tenia razon: el
  pliego de la Task 4 solo nombraba dos disparadores (iniciarManual y confirmarManual),
  pero la ESPECIFICACION §3.6 nombra TRES "y solo estas tres", y la tercera es "crear una
  sesion de pago" — que es literalmente iniciarTarjeta.
  No es cosmetico: sin planificador, esas llamadas son el mecanismo entero de liberacion de
  stock, y la tarjeta va a ser el canal digital mas usado. Tal como estaba, una clienta que
  abre sesiones de pago y abandona no disparaba ninguna liberacion: el stock quedaba
  retenido por el camino principal, justo lo que el diseno dice resolver.
  DECIDIDO: se engancha, con su prueba, y la llamada va ANTES de la guarda del 503 o en un
  servidor sin claves no ocurriria nunca. La especificacion manda sobre el plan. Si me
  equivoco: una llamada de mas en un camino que ya hace una consulta a la base.
Task 7: fix round 1/5 despachado (incluye el minor de que la prueba del 503 no verificaba
  que tampoco se consultara la venta). FIX_BASE=8e83332
Task 7: minor (deferred): el texto de la descripcion de la sesion de Stripe
  ("Compra <comprobante>") es decision del implementador, sin respaldo en el pliego.
  Se deja: es lo que ve la clienta en la pagina de pago y esta bien.
Task 7: fix round 1/5 (2 addressed, 0 open — expirarVencidas como PRIMERA linea, antes de
  la guarda del 503; commits 8e83332..e50bb19)
Task 7: complete (commits f235497..e50bb19, review clean). 139 unitarias + 43 e2e.
Task 8: despachada (sonnet), BASE=e50bb19. ES LA MAS DELICADA DEL PLAN: el webhook decide
  si una venta se cobro, no lleva JWT, y la firma es su unica defensa.
Task 8: implementada (4d30b89, 144 unitarias + 43 e2e). Concern agudo del implementador:
  NADA verifica que main.ts siga con rawBody. Quitarlo deja la suite en verde y rompe la
  verificacion de firma en produccion. Mismo patron que el enganche de la expiracion.
  Se resuelve en la Task 9, que es el e2e del webhook.
Task 8: revision — 6 de los 7 puntos de riesgo BIEN: la firma se verifica antes de todo y
  una firma invalida no deja efecto alguno; la idempotencia corta el reintento; main.ts
  cambia UNA linea aditiva; el endpoint es publico y ESTA COMENTADO (el revisor confirmo
  ademas que no hay APP_GUARD global que lo cubra por accidente); no llama a la expiracion;
  y un evento que no es de pago devuelve 200 sin tocar nada.

Ruling P8 (CRITICAL): el webhook tenia el MISMO defecto de atomicidad que ya arregle en la
  confirmacion manual — mi plan lo dejo suelto en este camino. Guardaba el pago como
  APROBADO y recien despues llamaba a marcarPagada; si la venta estaba CANCELADA, el pago
  quedaba aprobado para siempre, la pasarela recibia un 409, reintentaba, y en el reintento
  el guard de idempotencia devolvia 200 en silencio TAPANDO que habia quedado mal.
  PERO la decision correcta NO es la misma que en el cobro manual. Ahi alcanzaba con
  revertir. Aca la clienta PAGO DE VERDAD: Stripe le cobro. Revertir el registro para
  "quedar consistente" perderia la unica constancia de que entro dinero, y nadie se
  enteraria de que hay que devolverselo.
  DECIDIDO: el pago se guarda igual, con `motivoReembolso` seteado — columna que ya existe
  en la tabla y es exactamente para esto — y se loguea a nivel error. Se devuelve 200, no un
  error, porque ningun reintento de la pasarela va a arreglar esto: lo resuelve una persona.
  El estado queda describiendose solo en vez de ser un registro mudo.
  Si me equivoco: quedaria un pago aprobado con motivo de reembolso sobre una venta
  cancelada — que es exactamente la verdad de lo que paso, visible para quien concilie.
Task 8: fix round 1/5 despachado. FIX_BASE=4d30b89
Task 8: minor (deferred): el controller no valida que exista el encabezado de firma antes
  de usarlo. El revisor dictamino que el comportamiento observable es identico (la firma
  vacia se rechaza igual), asi que no amerita cambio.
Task 8: IMPORTANT (deferred a la Task 9): nada prueba que main.ts conserve el cuerpo crudo.
  El revisor lo clasifico Important y no Critical porque falla CERRADO —rechaza todo en vez
  de aceptar lo indebido— pero es una regresion de disponibilidad total y silenciosa. Se
  resuelve en la Task 9 con un e2e HTTP real.
Task 8: fix round 1/5 (1 addressed, 0 open; commits 4d30b89..2c31194). El re-revisor
  confirmo lo fino: el guardado del camino feliz usa el MANAGER de la transaccion (no el
  repo suelto), y el guardado de rescate ocurre FUERA de la transaccion revertida sobre el
  objeto que conserva estado APROBADO, asi que motivoReembolso persiste de verdad.
Task 8: complete (commits e50bb19..2c31194, review clean). 146 unitarias + 43 e2e.
Task 8: minor (deferred): el doble hace que manager.getRepository() devuelva el mismo
  objeto que this.pagoRepository, asi que las aserciones no distinguen por si solas si se
  uso el manager o el repo suelto; eso solo se verifica leyendo el codigo. Patron preexistente.
Task 9: despachada (sonnet), BASE=2c31194. Se le suma el guard del rawBody de main.ts.
Task 9: implementada (de503a5). 47 e2e (antes 43), DOS corridas identicas con la base
  volviendo a cero filas propias. Incluye el guard del rawBody de main.ts.
Ruling P9 (IMPORTANT, hallazgo del revisor): CUARTO caso del dia de una prueba que pasa
  por el motivo equivocado. La de idempotencia contaba filas en `pagos`, pero procesarEvento
  NUNCA inserta —siempre actualiza la fila que creo iniciarTarjeta— asi que el conteo da 1
  pase lo que pase. Y como marcarPagada ya es idempotente por su cuenta, borrar la guarda
  del webhook deja la prueba en verde. El comportamiento final es correcto pero lo sostiene
  OTRA capa, no la guarda que la prueba dice cubrir.
  DECIDIDO: asertar sobre la RESPUESTA (procesado true la primera vez, false la segunda),
  que es lo unico que la guarda controla de forma observable, y pedir que se verifique el
  mutante borrando la guarda a mano. Si me equivoco: una asercion de mas sobre el cuerpo de
  la respuesta.
Task 9: fix round 1/5 despachado (incluye normalizar espacios en el guard del rawBody, que
  hoy compara texto exacto y se romperia por un reformateo ajeno). FIX_BASE=de503a5
Task 9: fix round 1/5 (2 addressed, 0 open; commits de503a5..9f3d624). El implementador
  VERIFICO EL MUTANTE con evidencia concreta (comando, mensaje exacto del fallo, git diff
  vacio tras restaurar) y el re-revisor dictamino que la evidencia respalda la afirmacion.
Task 9: complete (commits 2c31194..9f3d624, review clean).
  ETAPA 2 CERRADA: Stripe integrado, webhook firmado e idempotente, 146 unitarias + 47 e2e.
Lote 10+11: despachado (sonnet), BASE=9f3d624. Arranca el frontend.
Lote 10+11: implementado (50b53bb, 4c22de0). DOS concerns del implementador que son
  defectos del BACKEND, no suyos, y que paso a revision sin prejuzgar:
  (a) iniciarManual NO es idempotente: cada llamada crea un Pago nuevo, asi que un refresh
      de la pantalla de pago duplica la fila. Lo mitigo con useRef en el front pero eso no
      tapa un refresh real.
  (b) la URL de regreso de la pasarela es fija y no lleva el id de la venta, asi que la
      pantalla no puede consultar el estado real sin ayuda. Lo resolvio guardando el id en
      sessionStorage, que es un rodeo del lado del navegador.
Lote 10+11: revision — los 5 puntos de la pantalla salieron BIEN en el codigo: no afirma
  el pago por la ruta (lee el estado real), el texto del QR dice que la confirmacion es
  manual, el 503 muestra el mensaje del backend, qrUrl nulo no rompe nada, y el estilo
  calca el de las paginas existentes.

Ruling P10 (CRITICAL — DEFECTO PREEXISTENTE que nadie habia visto): GET /ventas/:id solo
  permite ADMIN y ENCARGADO_SUCURSAL, y VentasService.findOne no comprueba propiedad. O
  sea, una clienta recibe 403 al volver de la pasarela y NUNCA puede ver si su compra se
  cobro. El codigo de la pantalla es correcto —consulta el estado real en vez de afirmarlo
  por la ruta— pero el endpoint del que depende no es alcanzable para quien lo necesita.
  Afecta tambien a la pantalla de confirmacion de pedido, desde antes de este trabajo.
  DECIDIDO: se arregla. Una clienta puede leer SU PROPIA venta y solo la suya, reutilizando
  assertOwnUser, que ya se usa para el carrito y el checkout. El listado GET /ventas sigue
  siendo solo de staff. La prueba que mas importa es la negativa: que una clienta NO pueda
  leer la venta de otra. Si me equivoco: se abriria acceso de mas, y por eso la prueba
  negativa es obligatoria.
Ruling P11 (IMPORTANT, confirmado por el revisor): iniciarManual crea una fila nueva en
  cada llamada. Un refresh duplica el registro y la expiracion deja las duplicadas
  PENDIENTES PARA SIEMPRE —el error de cancelar una venta ya cancelada se traga en el
  catch— o sea basura permanente en el panel del equipo, mas riesgo de doble conteo si un
  cajero confirma dos. DECIDIDO: reutilizar la fila pendiente de esa venta, actualizando el
  metodo si cambio. Si me equivoco: se crearia una sola fila donde antes habia N, que es lo
  correcto igual.
Ruling P12 (IMPORTANT): la URL de regreso de la pasarela es fija y no lleva la venta, asi
  que la pantalla no sabe que consultar. El rodeo por sessionStorage FALLA HONESTO (si no
  hay dato dice "no encontramos tu compra" en vez de inventar un estado), pero es fragil
  ante otra pestana, otro dispositivo o datos borrados. DECIDIDO: el backend agrega el
  identificador como parametro y el frontend lo lee de ahi primero, dejando el respaldo por
  si hay configuracion vieja. Si me equivoco: un parametro de mas en una URL.
Lote 10+11: fix round 1/5 despachado a un agente fresco (los arreglos son de backend y el
  implementador del frontend no debia tocarlo). FIX_BASE=4c22de0
Lote 10+11: minor (deferred): el selector de metodo usa botones con aria-pressed en vez de
  un grupo de radio nativo; funciona pero le falta semantica de accesibilidad.
Lote 10+11: minor (deferred): la clave de sessionStorage se repite como literal en dos
  archivos, siguiendo la convencion que ya existe en el repo.
Lote 10+11: fix round 1/5 (3 addressed, 0 open; commits 4c22de0..b0b5094). El re-revisor
  confirmo que el arreglo de acceso NO abre de mas: el staff no pasa por assertOwnUser, una
  venta presencial sin cliente no queda legible para ninguna clienta, el listado sigue
  cerrado, y la prueba NEGATIVA (clienta no lee venta ajena) existe y es explicita.
  La reutilizacion del pago esta acotada por venta + PENDIENTE + proveedor manual, asi que
  no puede tomar el pago de otra venta ni uno ya aprobado.
Lote 10+11: complete (commits 9f3d624..b0b5094, review clean). 150 unitarias + 50 e2e.
Task 12: despachada (sonnet), BASE=b0b5094
Task 12: implementada (8433683). Tres concerns: la columna Referencia muestra el id de la
  venta truncado en vez de referenciaExterna (que siempre es null mientras el pago esta
  PENDIENTE), eligio el icono Money verificandolo en node_modules, y no agrego titulo en el
  encabezado del panel para la ruta nueva (tampoco lo tiene reportes).
Task 12: complete (commits b0b5094..8433683, review clean). El guard quedo parametrizado
  con default igual al par de reportes, verificado linea a linea: mismo conjunto de acceso
  para reportes, ni un rol de mas ni de menos, y la ruta nueva coincide EXACTAMENTE con los
  roles del backend. Un solo guard, sin duplicar.
Task 12: minor (deferred): el default del guard es silencioso — una ruta futura que lo use
  sin especificar roles hereda el par de reportes sin que quede explicito.
HALLAZGO PREEXISTENTE DE LEONARDO (no nuestro, anotado): `ventas.numeroComprobante` es un
  CAMPO MUERTO — se crea siempre en null y NINGUN punto del backend lo escribe nunca, ni
  siquiera al cobrar. Por eso la referencia que ve la clienta cae siempre al id de la venta.
  Vale avisarselo a Leonardo.
Task 13: despachada (sonnet), BASE=8433683
Task 13: complete (commit 6c3f769). CIERRE: 150 unitarias + 50 e2e = 200 pruebas, lint y
  build limpios en las dos apps, 23 DE 23 TABLAS. LAS 13 TAREAS DEL PLAN ESTAN HECHAS.

== REVISION FINAL (opus) + OLA DE ARREGLO ==
La revision final encontro 3 CRITICAL y 5 IMPORTANT, todos en "los caminos donde el reloj y
la plata se cruzan", todos invisibles para las 200 pruebas. Los 9 se arreglaron y el
re-revisor los dictamino ADDRESSED, verificando el mutante del bloqueo por su cuenta con
log_statement=all en Postgres (dos backends distintos emitiendo FOR UPDATE sobre la misma
fila) y confirmando que la barrida nueva NO cancela lo que no debe (las presenciales nacen
PAGADA y solo hay dos creadores de Venta). 175 unitarias + 54 e2e.

Ruling P13 (CORRIJO al implementador, verificado por mi): declaro que createdAt/updatedAt
  son `timestamp` sin zona y que con Postgres en UTC y la maquina en UTC-4 "el reloj de los
  vencimientos queda corrido 4 horas". Lo probe de forma concluyente con pg directo: si la
  fecha la pone la BASE con su default now(), la app la lee 240 minutos EN EL FUTURO; pero
  si la pone la APLICACION —que es lo que hace @CreateDateColumn en el camino real— el
  desfase es CERO. O sea: la expiracion NO esta rota en produccion. Lo que queda es una
  trampa latente para cualquier insercion por SQL directo (seeds, importadores, arreglos a
  mano), que crearia filas con fechas 4 horas corridas. DECIDIDO: se aparca, se documenta,
  y NO se migra a timestamptz — eso toca BaseEntity y las 23 tablas, es de Leonardo, y
  excede esta rama. Si me equivoco: alguien inserta por SQL y ve vencimientos raros.

Ruling P14: se aparcan los tres menores residuales de la re-revision, con constancia.
  (a) con 200 ventas viejas que fallen siempre al cancelar, las nuevas no entran a la
      barrida — el riesgo baja mucho ahora que no quedan filas zombi;
  (b) en la pantalla de pago, el aviso del 503 se pierde al cambiar de metodo y un fallo de
      iniciarManual no muestra su motivo — pulido de interfaz;
  (c) una clienta que abandona la pantalla de pago mas de 30 minutos y vuelve recibe 409 en
      vez de poder pagar. Es la consecuencia del diseno elegido (la venta vence y su stock
      vuelve), no un defecto: el stock ya se devolvio y revenderlo seria peor.
  Si me equivoco: son tres asperezas conocidas y anotadas, no sorpresas.
