export type Dominio = 'ventas' | 'inventario' | 'kardex' | 'reservas' | 'cupones' | 'compras' | 'clientes';

export type Metrica =
  | 'ingresos' | 'unidades' | 'cantidad_ventas' | 'ticket_promedio' | 'descuentos'
  | 'stock_disponible' | 'stock_reservado' | 'stock_en_transito'
  | 'movimientos_unidades' | 'movimientos_conteo';

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

const FILTROS_VENTAS: Partial<Record<NombreFiltro, string>> = {
  sucursalId: 'v.sucursal_id = $',
  canal: 'v.canal = $',
  estado: 'v.estado = $',
  clienteId: 'v.cliente_id = $',
};

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
};

export const METRICAS = Object.keys(CATALOGO_METRICAS) as readonly Metrica[];
