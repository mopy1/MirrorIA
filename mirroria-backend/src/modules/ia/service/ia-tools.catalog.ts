export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export const IA_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'consultar_metricas',
      description: 'Consulta metricas agregadas historicas del catalogo semantico.',
      parameters: {
        type: 'object',
        properties: {
          metrica: {
            type: 'string',
            enum: [
              'ingresos', 'unidades', 'cantidad_ventas', 'ticket_promedio', 'descuentos',
              'stock_disponible', 'stock_reservado', 'stock_en_transito', 'movimientos_unidades',
              'cantidad_reservas', 'unidades_reservadas', 'canjes_cupon', 'cantidad_ordenes',
              'clientes_activos', 'cantidad_usuarios', 'cantidad_productos', 'cantidad_sucursales',
            ],
            description: 'Nombre de la metrica semantica a consultar.',
          },
          dimension: {
            type: 'string',
            enum: ['producto', 'categoria', 'sucursal', 'proveedor', 'canal', 'estado', 'cliente', 'dia', 'mes', 'ninguno'],
            description: 'Dimension para agrupar los resultados.',
          },
          limite: { type: 'number', description: 'Cantidad maxima de filas (ej. 5 para top 5, default 10).' },
          orden: { type: 'string', enum: ['desc', 'asc'], description: 'Orden de resultados (default desc).' },
          fechaInicio: { type: 'string', description: 'Fecha inicio YYYY-MM-DD.' },
          fechaFin: { type: 'string', description: 'Fecha fin YYYY-MM-DD.' },
          sucursalId: { type: 'string', description: 'UUID de sucursal opcional.' },
          categoriaId: { type: 'string', description: 'UUID de categoria opcional.' },
          canal: { type: 'string', enum: ['TIENDA_FISICA', 'ONLINE_WEB', 'ONLINE_MOVIL'], description: 'Canal de venta.' },
        },
        required: ['metrica'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_proveedores_stock',
      description: 'Consulta ordenes de compra y stock en transito de proveedores.',
      parameters: {
        type: 'object',
        properties: {
          proveedorId: { type: 'string', description: 'UUID del proveedor opcional.' },
          sucursalId: { type: 'string', description: 'UUID de sucursal opcional.' },
          estado: {
            type: 'string',
            enum: ['PENDIENTE', 'RECIBIDA_PARCIAL', 'RECIBIDA', 'TODOS'],
            description: 'Filtro por estado de la orden.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'simular_what_if',
      description: 'Proyecta escenarios hipoteticos (descuentos, margen o volumen) con DuckDB.',
      parameters: {
        type: 'object',
        properties: {
          variacionPrecioPct: { type: 'number', description: 'Porcentaje de cambio en precio (-10 a 50).' },
          variacionVolumenPct: { type: 'number', description: 'Porcentaje de cambio en volumen de ventas.' },
        },
        required: ['variacionPrecioPct'],
      },
    },
  },
];
