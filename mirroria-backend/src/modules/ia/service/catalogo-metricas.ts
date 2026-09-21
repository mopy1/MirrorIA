export type Dominio = 'ventas' | 'inventario' | 'kardex' | 'reservas' | 'cupones' | 'compras' | 'clientes';

export type Metrica =
  | 'ingresos' | 'unidades' | 'cantidad_ventas' | 'ticket_promedio' | 'descuentos'
  | 'stock_disponible' | 'stock_reservado' | 'stock_en_transito'
  | 'movimientos_unidades' | 'movimientos_conteo'
  | 'cantidad_reservas' | 'unidades_reservadas'
  | 'canjes_cupon' | 'descuento_por_cupon'
  | 'cantidad_ordenes' | 'unidades_pedidas' | 'unidades_recibidas';

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
    filtros: { sucursalId: 'i.sucursal_id = $' },
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
  };
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
    dimensiones: dimensionesDeVentas(),
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
    filtros: FILTROS_VENTAS,
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
    dimensiones: dimensionesDeVentas(),
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
    dimensiones: dimensionesDeVentas(),
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
    filtros: FILTROS_VENTAS,
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
};

export const METRICAS = Object.keys(CATALOGO_METRICAS) as readonly Metrica[];
