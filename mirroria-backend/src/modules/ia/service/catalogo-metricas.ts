export type Dominio = 'ventas' | 'inventario' | 'kardex' | 'reservas' | 'cupones' | 'compras' | 'clientes';

export type Metrica =
  | 'ingresos' | 'unidades' | 'cantidad_ventas' | 'ticket_promedio' | 'descuentos'
  | 'stock_disponible' | 'stock_reservado' | 'stock_en_transito'
  | 'movimientos_unidades' | 'movimientos_conteo'
  | 'cantidad_reservas' | 'unidades_reservadas'
  | 'canjes_cupon' | 'descuento_por_cupon'
  | 'cantidad_ordenes' | 'unidades_pedidas' | 'unidades_recibidas'
  | 'clientes_activos';

export type Dimension =
  | 'sucursal' | 'categoria' | 'producto' | 'canal' | 'estado'
  | 'cliente' | 'cupon' | 'proveedor' | 'tipo_movimiento' | 'dia' | 'mes' | 'ninguno';

export type NombreFiltro =
  | 'sucursalId' | 'categoriaId' | 'productoId' | 'clienteId' | 'proveedorId'
  | 'canal' | 'estado' | 'tipoMovimiento';

/** Como alcanzar y etiquetar una dimension desde una metrica concreta. */
export interface DimensionSpec {
  /** Expresion SQL para GROUP BY y como clave de la fila. */
  grupo: string;
  /** Expresion SQL para el nombre legible que ve el usuario. */
  etiqueta: string;
  /** JOINs necesarios solo para esta dimension. */
  joins: string[];
  /**
   * Agregacion que REEMPLAZA a `DefinicionMetrica.seleccion` cuando se agrupa por
   * esta dimension. Existe por un motivo concreto y no por flexibilidad:
   *
   * Alcanzar `categoria` o `producto` desde `ventas` obliga a joinear
   * `venta_items`, y ese join MULTIPLICA cada venta por su cantidad de lineas.
   * Una agregacion sobre columnas de la CABECERA (`v.total_cents`) queda contada
   * entera una vez por linea: una venta de 10000 con una linea de Vestidos y otra
   * de Blusas sumaba 10000 en cada categoria. Con el join puesto, la unica
   * agregacion que sigue siendo verdad es la que agrega sobre la LINEA, y para el
   * dinero esa es `venta_items.subtotal_cents`.
   *
   * Solo se declara donde el cambio de expresion conserva el significado de la
   * metrica. Donde no lo conserva (`descuentos` y `ticket_promedio`, que viven en
   * la cabecera y no se pueden repartir entre lineas sin inventar una regla de
   * prorrateo), la dimension directamente NO se ofrece.
   *
   * CONSECUENCIA DECLARADA — el ingreso por `categoria`/`producto` es BRUTO DE
   * DESCUENTOS, y el ingreso sin agrupar es NETO. No son la misma cifra:
   *
   *   sin agrupar   -> SUM(v.total_cents)     = subtotal - descuento  (NETO)
   *   por categoria -> SUM(vi.subtotal_cents) = antes del descuento   (BRUTO)
   *
   * Sumar las filas de un reporte por categoria da MAS que el total del periodo,
   * exactamente por el monto de los descuentos de esas ventas. No es un defecto y no
   * se corrige: el descuento vive en la CABECERA de la venta y no se puede atribuir a
   * una linea sin inventar un prorrateo (¿por subtotal?, ¿por unidades?) que el
   * negocio nunca declaro. Fijado en la e2e "el ingreso por categoria es BRUTO".
   */
  seleccionAlterna?: string;
}

export interface DefinicionMetrica {
  dominio: Dominio;
  /** Clausula FROM con alias, ej. 'ventas v'. */
  from: string;
  /** JOINs que la metrica necesita siempre, sin importar la dimension. */
  joinsBase: string[];
  /** Agregacion. Siempre envuelta en COALESCE: sin filas, el reporte dice 0, no null. */
  seleccion: string;
  /** Columna por la que filtran `desde`/`hasta`. null = la metrica no tiene tiempo. */
  columnaFecha: string | null;
  /** Segunda columna de fecha, elegible con `ficha.campoFecha`. Solo reservas. Ver spec 4-bis.2. */
  columnaFechaAlterna?: string;
  /** Filtro admitido -> expresion SQL comparable contra el parametro. */
  filtros: Partial<Record<NombreFiltro, string>>;
  dimensiones: Partial<Record<Dimension, DimensionSpec>>;
  /** Valores validos de `filtros.estado` para este dominio. null = no aplica. */
  estadoValido: readonly string[] | null;
  /** Se aplica salvo que la ficha pida un estado explicito. Ver spec 3.2. */
  filtroEstadoPorDefecto: string | null;
  permiteComparacion: boolean;
}

const ESTADOS_VENTA = [
  'PENDIENTE', 'PAGADA', 'ENTREGADA', 'CANCELADA', 'DEVUELTA_PARCIAL', 'DEVUELTA_TOTAL',
] as const;

/** venta_items -> variantes -> productos, el camino de ventas hacia el catalogo. */
const JOIN_VENTA_ITEMS = 'JOIN venta_items vi ON vi.venta_id = v.id';
const JOIN_PRODUCTO_DESDE_VI =
  'JOIN variantes_producto vp ON vp.id = vi.variante_id JOIN productos p ON p.id = vp.producto_id';
/** inventario_sucursal -> variantes -> productos. */
const JOIN_PRODUCTO_DESDE_INV =
  'JOIN variantes_producto vp ON vp.id = i.variante_id JOIN productos p ON p.id = vp.producto_id';

const DIM_NINGUNO: DimensionSpec = { grupo: "'total'", etiqueta: "'Total'", joins: [] };

/**
 * Filtrar por categoria o producto una metrica cuyo FROM es `ventas v` se hace con
 * un EXISTS sobre `venta_items`, NUNCA con un JOIN.
 *
 * Dos motivos, los dos medidos: (a) el JOIN multiplica cada venta por su cantidad de
 * lineas — el mismo fan-out que inflaba el dinero por categoria; (b) el camino hacia
 * el catalogo solo esta disponible cuando la DIMENSION elegida lo trae, y un filtro no
 * puede depender de por que se agrupa. El EXISTS no multiplica nada, sirve con
 * cualquier agrupacion, y dice exactamente lo que significa: "ventas que incluyeron
 * esto". Para `SUM`/`AVG` sobre la cabecera ese recorte NO alcanza (el total de la
 * venta sigue sin ser el de esa categoria), asi que esas metricas no lo ofrecen.
 */
const VENTA_CON_CATEGORIA =
  'EXISTS (SELECT 1 FROM venta_items fvi' +
  ' JOIN variantes_producto fvp ON fvp.id = fvi.variante_id' +
  ' JOIN productos fp ON fp.id = fvp.producto_id' +
  ' WHERE fvi.venta_id = v.id AND fp.categoria_id = $)';
const VENTA_CON_PRODUCTO =
  'EXISTS (SELECT 1 FROM venta_items fvi' +
  ' JOIN variantes_producto fvp ON fvp.id = fvi.variante_id' +
  ' WHERE fvi.venta_id = v.id AND fvp.producto_id = $)';

/**
 * Cuando la metrica YA agrega fila a fila sobre una variante (`unidades` sobre
 * `venta_items`, el stock sobre `inventario_sucursal`, el kardex sobre
 * `movimientos_inventario`), el filtro va sobre la PROPIA fila, no con EXISTS:
 * "unidades de Vestidos" son las unidades de las lineas de Vestidos, no todas las
 * unidades de las ventas que ademas llevaban un vestido.
 */
const VARIANTES_DE_CATEGORIA =
  '(SELECT fvp.id FROM variantes_producto fvp' +
  ' JOIN productos fp ON fp.id = fvp.producto_id WHERE fp.categoria_id = $)';
const VARIANTES_DE_PRODUCTO = '(SELECT fvp.id FROM variantes_producto fvp WHERE fvp.producto_id = $)';

/**
 * Inventario es una foto del presente: `inventario_sucursal` no guarda historia.
 * Por eso no tiene columnaFecha, no admite dia/mes y no permite comparacion.
 * Para la evolucion en el tiempo esta el kardex (Task 8).
 */
function definicionInventario(seleccion: string): DefinicionMetrica {
  return {
    dominio: 'inventario',
    from: 'inventario_sucursal i',
    joinsBase: [],
    seleccion,
    columnaFecha: null,
    filtros: {
      sucursalId: 'i.sucursal_id = $',
      // "¿cuanto stock tengo de Vestidos?": el filtro recorta la propia fila de stock.
      categoriaId: `i.variante_id IN ${VARIANTES_DE_CATEGORIA}`,
      productoId: `i.variante_id IN ${VARIANTES_DE_PRODUCTO}`,
    },
    dimensiones: {
      ninguno: DIM_NINGUNO,
      sucursal: {
        grupo: 'i.sucursal_id',
        etiqueta: 's.nombre',
        joins: ['JOIN sucursales s ON s.id = i.sucursal_id'],
      },
      categoria: {
        grupo: 'c.id',
        etiqueta: 'c.nombre',
        joins: [JOIN_PRODUCTO_DESDE_INV, 'JOIN categorias c ON c.id = p.categoria_id'],
      },
      producto: { grupo: 'p.id', etiqueta: 'p.titulo', joins: [JOIN_PRODUCTO_DESDE_INV] },
    },
    estadoValido: null,
    filtroEstadoPorDefecto: null,
    permiteComparacion: false,
  };
}

/** Dimensiones comunes a las metricas cuyo FROM es `ventas v`. */
function dimensionesDeVentas(): Partial<Record<Dimension, DimensionSpec>> {
  return {
    ninguno: DIM_NINGUNO,
    sucursal: {
      grupo: 'v.sucursal_id',
      etiqueta: 's.nombre',
      joins: ['JOIN sucursales s ON s.id = v.sucursal_id'],
    },
    canal: { grupo: 'v.canal', etiqueta: 'v.canal', joins: [] },
    estado: { grupo: 'v.estado', etiqueta: 'v.estado', joins: [] },
    dia: {
      grupo: "date_trunc('day', v.\"createdAt\")",
      etiqueta: "to_char(date_trunc('day', v.\"createdAt\"), 'YYYY-MM-DD')",
      joins: [],
    },
    mes: {
      grupo: "date_trunc('month', v.\"createdAt\")",
      etiqueta: "to_char(date_trunc('month', v.\"createdAt\"), 'YYYY-MM')",
      joins: [],
    },
    categoria: {
      grupo: 'c.id',
      etiqueta: 'c.nombre',
      joins: [JOIN_VENTA_ITEMS, JOIN_PRODUCTO_DESDE_VI, 'JOIN categorias c ON c.id = p.categoria_id'],
    },
    producto: {
      grupo: 'p.id',
      etiqueta: 'p.titulo',
      joins: [JOIN_VENTA_ITEMS, JOIN_PRODUCTO_DESDE_VI],
    },
    // Un "cliente" es un `usuarios` con rol CUSTOMER: no hay entidad propia.
    // El INNER JOIN ya descarta las ventas sin cliente. Ver spec 4-bis.5.
    cliente: {
      grupo: 'v.cliente_id',
      etiqueta: 'u.full_name',
      joins: ['JOIN usuarios u ON u.id = v.cliente_id'],
    },
  };
}

/**
 * El ingreso REAL de una linea de venta. Ya existe en la base: no se calcula.
 * Es BRUTO de descuentos — el descuento vive en la cabecera. Ver `seleccionAlterna`.
 */
const INGRESO_DE_LINEAS = 'COALESCE(SUM(vi.subtotal_cents), 0)';

/**
 * Dimensiones de `ingresos`. Identicas a las de ventas salvo que `categoria` y
 * `producto` cambian la agregacion por la de las LINEAS (ver `seleccionAlterna`):
 * con `venta_items` joineado, sumar `v.total_cents` cuenta la venta entera en cada
 * categoria que toca. Medido: una venta de 10000 con dos lineas daba 10000 en una
 * categoria cuando la verdad de esa categoria era 6000.
 */
function dimensionesDeIngresos(): Partial<Record<Dimension, DimensionSpec>> {
  return {
    ...dimensionesDeVentas(),
    categoria: {
      grupo: 'c.id',
      etiqueta: 'c.nombre',
      joins: [JOIN_VENTA_ITEMS, JOIN_PRODUCTO_DESDE_VI, 'JOIN categorias c ON c.id = p.categoria_id'],
      seleccionAlterna: INGRESO_DE_LINEAS,
    },
    producto: {
      grupo: 'p.id',
      etiqueta: 'p.titulo',
      joins: [JOIN_VENTA_ITEMS, JOIN_PRODUCTO_DESDE_VI],
      seleccionAlterna: INGRESO_DE_LINEAS,
    },
  };
}

/**
 * Dimensiones de las metricas de ventas cuyo dinero vive en la CABECERA:
 * `descuentos` (`v.descuento_cents`) y `ticket_promedio` (`AVG(v.total_cents)`).
 *
 * Se les QUITAN `categoria` y `producto`. El descuento y el total de una venta no
 * pertenecen a ninguna linea en particular, y repartirlos entre lineas exigiria
 * una regla de prorrateo (¿por subtotal?, ¿por unidades?) que el negocio no
 * declaro en ningun lado. Inventarla en silencio es exactamente lo que este
 * diseño vino a evitar, asi que pedir esa combinacion es 400.
 * Para el dinero por categoria esta `ingresos`, que si tiene de donde sacarlo.
 */
function dimensionesDeCabecera(): Partial<Record<Dimension, DimensionSpec>> {
  const dims = dimensionesDeVentas();
  delete dims.categoria;
  delete dims.producto;
  return dims;
}

export const TIPOS_MOVIMIENTO = [
  'RESERVA', 'LIBERACION_RESERVA', 'VENTA', 'DEVOLUCION', 'RECEPCION_PROVEEDOR', 'AJUSTE',
] as const;

const JOIN_PRODUCTO_DESDE_MOV =
  'JOIN variantes_producto vp ON vp.id = m.variante_id JOIN productos p ON p.id = vp.producto_id';

function definicionKardex(seleccion: string): DefinicionMetrica {
  return {
    dominio: 'kardex',
    from: 'movimientos_inventario m',
    joinsBase: [],
    seleccion,
    // `movimientos_inventario` tiene columna `fecha` propia, distinta del
    // created_at que hereda de BaseEntity. Ver spec 4-bis.3.
    columnaFecha: 'm.fecha',
    filtros: {
      sucursalId: 'm.sucursal_id = $',
      tipoMovimiento: 'm.tipo_movimiento = $',
      // El movimiento es de UNA variante: el filtro recorta la propia fila.
      categoriaId: `m.variante_id IN ${VARIANTES_DE_CATEGORIA}`,
      productoId: `m.variante_id IN ${VARIANTES_DE_PRODUCTO}`,
    },
    dimensiones: {
      ninguno: DIM_NINGUNO,
      sucursal: {
        grupo: 'm.sucursal_id',
        etiqueta: 's.nombre',
        joins: ['JOIN sucursales s ON s.id = m.sucursal_id'],
      },
      tipo_movimiento: { grupo: 'm.tipo_movimiento', etiqueta: 'm.tipo_movimiento', joins: [] },
      producto: { grupo: 'p.id', etiqueta: 'p.titulo', joins: [JOIN_PRODUCTO_DESDE_MOV] },
      categoria: {
        grupo: 'c.id',
        etiqueta: 'c.nombre',
        joins: [JOIN_PRODUCTO_DESDE_MOV, 'JOIN categorias c ON c.id = p.categoria_id'],
      },
      dia: {
        grupo: "date_trunc('day', m.fecha)",
        etiqueta: "to_char(date_trunc('day', m.fecha), 'YYYY-MM-DD')",
        joins: [],
      },
      mes: {
        grupo: "date_trunc('month', m.fecha)",
        etiqueta: "to_char(date_trunc('month', m.fecha), 'YYYY-MM')",
        joins: [],
      },
    },
    estadoValido: null,
    filtroEstadoPorDefecto: null,
    permiteComparacion: true,
  };
}

export const ESTADOS_RESERVA = [
  'PENDIENTE', 'CONFIRMADA', 'EN_TIENDA', 'COMPLETADA', 'CANCELADA', 'EXPIRADA', 'NO_SHOW',
] as const;

const JOIN_RESERVA_ITEMS = 'JOIN reserva_items ri ON ri.reserva_id = r.id';

function definicionReservas(seleccion: string, joinsBase: string[]): DefinicionMetrica {
  return {
    dominio: 'reservas',
    from: 'reservas r',
    joinsBase,
    seleccion,
    // created_at = cuando se hizo la reserva. fecha_hora_prevista = cuando la
    // clienta va a la tienda. Son preguntas distintas. Ver spec 4-bis.2.
    columnaFecha: 'r."createdAt"',
    columnaFechaAlterna: 'r.fecha_hora_prevista',
    filtros: { sucursalId: 'r.sucursal_id = $', estado: 'r.estado = $', clienteId: 'r.cliente_id = $' },
    dimensiones: {
      ninguno: DIM_NINGUNO,
      estado: { grupo: 'r.estado', etiqueta: 'r.estado', joins: [] },
      sucursal: {
        grupo: 'r.sucursal_id',
        etiqueta: 's.nombre',
        joins: ['JOIN sucursales s ON s.id = r.sucursal_id'],
      },
      dia: {
        grupo: "date_trunc('day', r.\"createdAt\")",
        etiqueta: "to_char(date_trunc('day', r.\"createdAt\"), 'YYYY-MM-DD')",
        joins: [],
      },
      mes: {
        grupo: "date_trunc('month', r.\"createdAt\")",
        etiqueta: "to_char(date_trunc('month', r.\"createdAt\"), 'YYYY-MM')",
        joins: [],
      },
    },
    estadoValido: ESTADOS_RESERVA,
    // Una reserva PENDIENTE es una reserva real: no hay estado "correcto" por
    // defecto como si lo hay en ventas.
    filtroEstadoPorDefecto: null,
    permiteComparacion: true,
  };
}

/**
 * Los canjes salen de `ventas`, agrupando por cupon_id. NO de
 * `cupones.usos_actuales`: ese contador es un acumulado sin fecha, y usarlo
 * devolveria el mismo numero para cualquier periodo. Ver spec 4-bis.1.
 *
 * El JOIN a cupones es INNER: ya descarta por si solo las ventas sin cupon,
 * pase lo que pase con el filtro de estado.
 */
function definicionCupones(seleccion: string): DefinicionMetrica {
  return {
    dominio: 'cupones',
    from: 'ventas v',
    joinsBase: ['JOIN cupones cu ON cu.id = v.cupon_id'],
    seleccion,
    columnaFecha: 'v."createdAt"',
    filtros: { sucursalId: 'v.sucursal_id = $', canal: 'v.canal = $', estado: 'v.estado = $' },
    dimensiones: {
      ninguno: DIM_NINGUNO,
      cupon: { grupo: 'cu.id', etiqueta: 'cu.codigo', joins: [] },
      sucursal: {
        grupo: 'v.sucursal_id',
        etiqueta: 's.nombre',
        joins: ['JOIN sucursales s ON s.id = v.sucursal_id'],
      },
      mes: {
        grupo: "date_trunc('month', v.\"createdAt\")",
        etiqueta: "to_char(date_trunc('month', v.\"createdAt\"), 'YYYY-MM')",
        joins: [],
      },
    },
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  };
}

const FILTROS_VENTAS: Partial<Record<NombreFiltro, string>> = {
  sucursalId: 'v.sucursal_id = $',
  canal: 'v.canal = $',
  estado: 'v.estado = $',
  clienteId: 'v.cliente_id = $',
};

/**
 * Filtros de las metricas de ventas que CUENTAN filas enteras (`cantidad_ventas`,
 * `clientes_activos`). Para ellas "categoria Vestidos" significa sin ambiguedad
 * "las ventas que incluyeron un vestido", y el EXISTS lo dice exactamente.
 *
 * `ingresos`, `descuentos` y `ticket_promedio` NO lo reciben, por el mismo motivo por
 * el que `descuentos` y `ticket_promedio` perdieron esas dimensiones: recortar las
 * ventas que tocan una categoria no convierte el total de cabecera en el dinero de esa
 * categoria. `ingresos` filtrado asi diria 10000 donde la verdad de la categoria es
 * 6000 — el mismo numero inflado de antes, ahora por otra puerta. La pregunta
 * "cuanto vendi de Vestidos" se contesta con `ingresos` agrupado por `categoria`,
 * que agrega sobre las lineas y da la cifra correcta.
 */
const FILTROS_VENTAS_POR_CATALOGO: Partial<Record<NombreFiltro, string>> = {
  ...FILTROS_VENTAS,
  categoriaId: VENTA_CON_CATEGORIA,
  productoId: VENTA_CON_PRODUCTO,
};

/**
 * Filtros de `unidades`, que ya agrega sobre `venta_items`: el recorte va sobre la
 * LINEA. Con el EXISTS de arriba contaria tambien las unidades de las otras
 * categorias de esas mismas ventas.
 */
const FILTROS_UNIDADES: Partial<Record<NombreFiltro, string>> = {
  ...FILTROS_VENTAS,
  categoriaId: `vi.variante_id IN ${VARIANTES_DE_CATEGORIA}`,
  productoId: `vi.variante_id IN ${VARIANTES_DE_PRODUCTO}`,
};

export const ESTADOS_ORDEN = [
  'PENDIENTE', 'EN_TRANSITO', 'RECIBIDA_PARCIAL', 'RECIBIDA', 'CANCELADA',
] as const;

/** `ordenes_compra.items` es jsonb, no una tabla. Ver spec 4-bis.4. */
const JOIN_ITEMS_JSONB = 'CROSS JOIN LATERAL jsonb_array_elements(oc.items) AS it(item)';

const DIMENSIONES_COMPRAS: Partial<Record<Dimension, DimensionSpec>> = {
  ninguno: DIM_NINGUNO,
  estado: { grupo: 'oc.estado', etiqueta: 'oc.estado', joins: [] },
  proveedor: {
    grupo: 'oc.proveedor_id',
    etiqueta: 'pr.razon_social',
    joins: ['JOIN proveedores pr ON pr.id = oc.proveedor_id'],
  },
  sucursal: {
    grupo: 'oc.sucursal_destino_id',
    etiqueta: 's.nombre',
    joins: ['JOIN sucursales s ON s.id = oc.sucursal_destino_id'],
  },
  mes: {
    grupo: "date_trunc('month', oc.fecha_pedido)",
    etiqueta: "to_char(date_trunc('month', oc.fecha_pedido), 'YYYY-MM')",
    joins: [],
  },
};

function definicionCompras(seleccion: string, joinsBase: string[]): DefinicionMetrica {
  return {
    dominio: 'compras',
    from: 'ordenes_compra oc',
    joinsBase,
    seleccion,
    columnaFecha: 'oc.fecha_pedido',
    filtros: {
      proveedorId: 'oc.proveedor_id = $',
      sucursalId: 'oc.sucursal_destino_id = $',
      estado: 'oc.estado = $',
    },
    dimensiones: DIMENSIONES_COMPRAS,
    estadoValido: ESTADOS_ORDEN,
    filtroEstadoPorDefecto: null,
    permiteComparacion: true,
  };
}

export const CATALOGO_METRICAS: Record<Metrica, DefinicionMetrica> = {
  ingresos: {
    dominio: 'ventas',
    from: 'ventas v',
    joinsBase: [],
    seleccion: 'COALESCE(SUM(v.total_cents), 0)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS,
    dimensiones: dimensionesDeIngresos(),
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  },
  cantidad_ventas: {
    dominio: 'ventas',
    from: 'ventas v',
    joinsBase: [],
    seleccion: 'COUNT(DISTINCT v.id)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS_POR_CATALOGO,
    dimensiones: dimensionesDeVentas(),
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  },
  ticket_promedio: {
    dominio: 'ventas',
    from: 'ventas v',
    joinsBase: [],
    seleccion: 'COALESCE(ROUND(AVG(v.total_cents)), 0)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS,
    dimensiones: dimensionesDeCabecera(),
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  },
  descuentos: {
    dominio: 'ventas',
    from: 'ventas v',
    joinsBase: [],
    seleccion: 'COALESCE(SUM(v.descuento_cents), 0)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS,
    dimensiones: dimensionesDeCabecera(),
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  },
  // `unidades` suma cantidades de items: necesita el join a venta_items SIEMPRE,
  // no solo cuando la dimension lo pide.
  unidades: {
    dominio: 'ventas',
    from: 'ventas v',
    joinsBase: [JOIN_VENTA_ITEMS],
    seleccion: 'COALESCE(SUM(vi.cantidad), 0)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_UNIDADES,
    dimensiones: {
      ...dimensionesDeVentas(),
      // El join a venta_items ya esta en joinsBase; declararlo de nuevo lo duplicaria.
      categoria: {
        grupo: 'c.id',
        etiqueta: 'c.nombre',
        joins: [JOIN_PRODUCTO_DESDE_VI, 'JOIN categorias c ON c.id = p.categoria_id'],
      },
      producto: { grupo: 'p.id', etiqueta: 'p.titulo', joins: [JOIN_PRODUCTO_DESDE_VI] },
    },
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  },
  stock_disponible: definicionInventario('COALESCE(SUM(i.cantidad_disponible), 0)'),
  stock_reservado: definicionInventario('COALESCE(SUM(i.cantidad_reservada), 0)'),
  stock_en_transito: definicionInventario('COALESCE(SUM(i.cantidad_en_transito), 0)'),
  movimientos_unidades: definicionKardex('COALESCE(SUM(m.cantidad), 0)'),
  movimientos_conteo: definicionKardex('COUNT(m.id)'),
  cantidad_reservas: definicionReservas('COUNT(DISTINCT r.id)', []),
  unidades_reservadas: definicionReservas('COALESCE(SUM(ri.cantidad), 0)', [JOIN_RESERVA_ITEMS]),
  canjes_cupon: definicionCupones('COUNT(DISTINCT v.id)'),
  descuento_por_cupon: definicionCupones('COALESCE(SUM(v.descuento_cents), 0)'),
  cantidad_ordenes: definicionCompras('COUNT(DISTINCT oc.id)', []),
  unidades_pedidas: definicionCompras(
    "COALESCE(SUM((it.item->>'cantidadPedida')::int), 0)", [JOIN_ITEMS_JSONB],
  ),
  unidades_recibidas: definicionCompras(
    "COALESCE(SUM((it.item->>'cantidadRecibida')::int), 0)", [JOIN_ITEMS_JSONB],
  ),
  clientes_activos: {
    dominio: 'clientes',
    from: 'ventas v',
    joinsBase: [],
    seleccion: 'COUNT(DISTINCT v.cliente_id)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS_POR_CATALOGO,
    dimensiones: dimensionesDeVentas(),
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA' AND v.cliente_id IS NOT NULL",
    permiteComparacion: true,
  },
};

export const METRICAS = Object.keys(CATALOGO_METRICAS) as readonly Metrica[];
