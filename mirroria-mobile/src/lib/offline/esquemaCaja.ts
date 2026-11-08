/**
 * Tablas de la caja del mostrador (equipo de la tienda). Separadas de las de la clienta:
 * su cola (`outbox`) devuelve prendas al carrito; la de la caja no tiene carrito al que volver.
 */
export const ESQUEMA_CAJA = [
  // Foto del stock de una sucursal: con esto la caja vende sin internet.
  `CREATE TABLE IF NOT EXISTS stock_caja (
    tienda TEXT NOT NULL,
    sucursal_id TEXT NOT NULL,
    variante_id TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    talla TEXT NOT NULL,
    color TEXT NOT NULL,
    sku TEXT NOT NULL,
    precio_cents INTEGER NOT NULL,
    disponible INTEGER NOT NULL,
    guardado_en INTEGER NOT NULL,
    PRIMARY KEY (tienda, sucursal_id, variante_id)
  )`,
  // Cuándo se tomó la foto de cada sucursal (también cuando la sucursal no tiene prendas).
  `CREATE TABLE IF NOT EXISTS stock_caja_foto (
    tienda TEXT NOT NULL,
    sucursal_id TEXT NOT NULL,
    guardado_en INTEGER NOT NULL,
    PRIMARY KEY (tienda, sucursal_id)
  )`,
  // Ventas de esta caja: las que esperan red y las ya enviadas (para descontar del stock guardado).
  `CREATE TABLE IF NOT EXISTS cola_caja (
    id TEXT PRIMARY KEY,
    tienda TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    sucursal_id TEXT NOT NULL,
    clave TEXT NOT NULL UNIQUE,
    payload TEXT NOT NULL,
    resumen TEXT NOT NULL,
    total_cents INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE',
    reintentos INTEGER NOT NULL DEFAULT 0,
    codigo INTEGER,
    error TEXT,
    respuesta TEXT,
    vendida_sin_conexion_en INTEGER,
    creado_en INTEGER NOT NULL,
    enviada_en INTEGER,
    aviso_visto INTEGER NOT NULL DEFAULT 0
  )`,
  'CREATE INDEX IF NOT EXISTS idx_cola_caja_estado ON cola_caja (tienda, usuario_id, estado, creado_en)',
];
