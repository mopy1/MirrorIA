import { CATALOGO_METRICAS, METRICAS, type Metrica } from '../catalogo-metricas.js';

/**
 * JSON Schema que se le pasa a Gemini como `responseSchema`. El modelo devuelve
 * algo que cumple esta forma o falla — no hay parseo de texto libre.
 * Se deriva del catalogo: nunca puede ofrecer una metrica que el motor no tenga.
 */
export const ESQUEMA_FICHA = {
  type: 'object',
  properties: {
    metrica: { type: 'string', enum: [...METRICAS] },
    agruparPor: {
      type: 'string',
      enum: [
        'sucursal', 'categoria', 'producto', 'canal', 'estado',
        'cliente', 'cupon', 'proveedor', 'tipo_movimiento', 'dia', 'mes', 'ninguno',
      ],
    },
    filtros: {
      type: 'object',
      properties: {
        desde: { type: 'string' },
        hasta: { type: 'string' },
        canal: { type: 'string' },
        estado: { type: 'string' },
        tipoMovimiento: { type: 'string' },
      },
    },
    campoFecha: { type: 'string', enum: ['creacion', 'prevista'] },
    compararCon: {
      type: 'object',
      properties: { desde: { type: 'string' }, hasta: { type: 'string' } },
    },
    orden: { type: 'string', enum: ['asc', 'desc'] },
    limite: { type: 'integer' },
  },
  required: ['metrica', 'agruparPor'],
} as const;

/**
 * La instruccion del sistema, derivada del catalogo. Cada metrica se describe con
 * las dimensiones que realmente admite, asi el modelo no propone combinaciones
 * que el motor va a rechazar.
 *
 * Los filtros por id (sucursalId, categoriaId...) NO se le ofrecen al modelo:
 * no conoce los uuid de la base. El alcance por sucursal lo impone el backend
 * desde el JWT (ver IaService.forzarAlcance).
 */
export function construirInstruccion(): string {
  const lineas = (Object.keys(CATALOGO_METRICAS) as Metrica[]).map((m) => {
    const def = CATALOGO_METRICAS[m];
    const dims = Object.keys(def.dimensiones).join(', ');
    const tiempo = def.columnaFecha ? 'admite fechas' : 'SIN fechas (foto del presente)';
    const comparacion = def.permiteComparacion ? 'comparable' : 'NO comparable';
    return `- ${m} (${def.dominio}): agrupar por [${dims}]. ${tiempo}, ${comparacion}.`;
  });

  return [
    'Sos un traductor de preguntas de negocio a una ficha de consulta estructurada.',
    'Devolves SOLO la ficha. No escribis SQL, no inventas datos, no respondes la pregunta.',
    '',
    'Metricas disponibles:',
    ...lineas,
    '',
    'Reglas:',
    '* Las fechas van en formato YYYY-MM-DD.',
    '* Si la pregunta no menciona periodo, no pongas filtros de fecha.',
    '* Si la pregunta compara dos periodos ("vs el mes pasado"), usa compararCon.',
    '* Si piden un "top N" o "los mas/menos", usa limite y orden.',
    '* Si la pregunta no se puede responder con ninguna metrica de la lista, devolve metrica vacia.',
    '* campoFecha solo aplica a metricas de reservas.',
  ].join('\n');
}
