/** Lo mínimo de SQLite que usa la app: permite probar el SQL real fuera del teléfono. */
export interface BaseLocal {
  ejecutar(sql: string, params?: (string | number | null)[]): Promise<void>;
  consultar<T>(sql: string, params?: (string | number | null)[]): Promise<T[]>;
}

const ESQUEMA = [
  `CREATE TABLE IF NOT EXISTS catalogo_cache (
    clave TEXT PRIMARY KEY,
    tienda TEXT NOT NULL,
    datos TEXT NOT NULL,
    guardado_en INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS carrito_local (
    tienda TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    variante_id TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    PRIMARY KEY (tienda, usuario_id, variante_id)
  )`,
  `CREATE TABLE IF NOT EXISTS carrito_estado (
    tienda TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    PRIMARY KEY (tienda, usuario_id)
  )`,
  `CREATE TABLE IF NOT EXISTS outbox (
    id TEXT PRIMARY KEY,
    tienda TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    clave TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    payload TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE',
    reintentos INTEGER NOT NULL DEFAULT 0,
    codigo INTEGER,
    respuesta TEXT,
    error TEXT,
    creado_en INTEGER NOT NULL,
    sincronizado_en INTEGER
  )`,
  'CREATE INDEX IF NOT EXISTS idx_outbox_estado ON outbox (tienda, usuario_id, estado, creado_en)',
];

export async function prepararBase(db: BaseLocal): Promise<void> {
  for (const sentencia of ESQUEMA) await db.ejecutar(sentencia);
}
