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
            enum: ['ingresos', 'ventas_totales', 'cantidad_ventas', 'ticket_promedio', 'unidades', 'stock_disponible', 'stock_en_transito'],
            description: 'Nombre de la metrica semantica a consultar.',
          },
          dimension: {
            type: 'string',
            enum: ['sucursal', 'mes', 'categoria'],
            description: 'Dimension para agrupar los resultados.',
          },
          fechaInicio: { type: 'string', description: 'Fecha inicio YYYY-MM-DD.' },
          fechaFin: { type: 'string', description: 'Fecha fin YYYY-MM-DD.' },
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
      description: 'Proyecta escenarios hipoteticos (descuentos, variaciones de margen o volumen) usando DuckDB in-memory.',
      parameters: {
        type: 'object',
        properties: {
          variacionPrecioPct: {
            type: 'number',
            description: 'Porcentaje de cambio en precio (ej: -10 para 10% de descuento, 15 para 15% de aumento).',
          },
          variacionVolumenPct: {
            type: 'number',
            description: 'Porcentaje de cambio estimado en volumen de ventas (ej: 20 para 20% de incremento).',
          },
          filtroCategoria: { type: 'string', description: 'Filtrar por categoria especifica.' },
        },
        required: ['variacionPrecioPct'],
      },
    },
  },
];
