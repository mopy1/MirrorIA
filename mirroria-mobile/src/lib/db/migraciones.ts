/**
 * Migraciones versionadas de `mirroria_local.db` (SQLite Local, spec §4.1).
 * Se aplican en orden según `PRAGMA user_version`. Una migración publicada NO se edita: se agrega otra.
 */
export interface Migracion {
  version: number;
  sql: string;
}

export const MIGRACIONES: Migracion[] = [
  {
    version: 1,
    sql: `
-- v1 ---------------------------------------------------------------
-- (Fase3 §5.1, se conserva) Una fila por prenda; payload_json = ProductoResponseDto con variantes
CREATE TABLE IF NOT EXISTS catalogo_local (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  precio_cents INTEGER NOT NULL,
  categoria TEXT,
  payload_json TEXT NOT NULL,
  guardado_en INTEGER NOT NULL     -- epoch ms; TTL 7 días
);
CREATE INDEX IF NOT EXISTS idx_catalogo_tenant ON catalogo_local(tenant_id);

-- Variantes planas: escáner de etiqueta (SKU) y joins de stock
CREATE TABLE IF NOT EXISTS variantes_local (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  producto_id TEXT NOT NULL REFERENCES catalogo_local(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  talla TEXT NOT NULL, talla_orden INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL, color_hex TEXT,
  activo INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_variantes_sku ON variantes_local(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_variantes_producto ON variantes_local(producto_id);

-- Snapshot del servidor (GET /inventario sin filtro = todas las sucursales de la tienda)
CREATE TABLE IF NOT EXISTS stock_local (
  tenant_id TEXT NOT NULL,
  variante_id TEXT NOT NULL,
  sucursal_id TEXT NOT NULL,
  disponible INTEGER NOT NULL,
  reservada INTEGER NOT NULL,
  en_transito INTEGER NOT NULL DEFAULT 0,
  guardado_en INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, variante_id, sucursal_id)
);

CREATE TABLE IF NOT EXISTS sucursales_local (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL,
  nombre TEXT NOT NULL, ciudad TEXT NOT NULL, direccion TEXT, telefono TEXT, activo INTEGER NOT NULL
);

-- Último carrito del servidor (para verlo sin red); los agregados offline se ven por la outbox
CREATE TABLE IF NOT EXISTS carrito_local (
  tenant_id TEXT NOT NULL, usuario_id TEXT NOT NULL,
  variante_id TEXT NOT NULL, cantidad INTEGER NOT NULL,
  guardado_en INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, usuario_id, variante_id)
);

-- (Fase3 §5.1) + usuario_id y grupo_id
CREATE TABLE IF NOT EXISTS outbox_local (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,        -- solo se envía con la sesión de esa clienta
  grupo_id TEXT,                   -- p. ej. "agregar al carrito" + "checkout" de la misma compra
  idempotency_key TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,              -- CARRITO_AGREGAR | CHECKOUT | RESERVA_CREAR
  endpoint TEXT NOT NULL,          -- '/ventas/carrito/<usuarioId>/checkout'
  metodo TEXT NOT NULL,            -- POST
  payload_json TEXT NOT NULL,      -- se guarda UNA vez y se reenvía igual (hash SHA-256 del interceptor)
  estado TEXT NOT NULL DEFAULT 'PENDIENTE'
    CHECK (estado IN ('PENDIENTE','ENVIANDO','CONFIRMADA','COMPENSADA','RECHAZADA')),
  reintentos INTEGER NOT NULL DEFAULT 0,
  proximo_intento_en INTEGER,
  codigo_respuesta INTEGER,
  cache_idempotencia TEXT,         -- 'HIT' | 'MISS'
  respuesta_json TEXT,
  ultimo_error TEXT,
  creado_en INTEGER NOT NULL,
  sincronizado_en INTEGER
);
CREATE INDEX IF NOT EXISTS idx_outbox_local_estado ON outbox_local(estado);
CREATE INDEX IF NOT EXISTS idx_outbox_local_fifo ON outbox_local(tenant_id, creado_en);

-- Efecto de cada operación sobre el stock local (D5)
CREATE TABLE IF NOT EXISTS outbox_items (
  outbox_id TEXT NOT NULL REFERENCES outbox_local(id) ON DELETE CASCADE,
  variante_id TEXT NOT NULL,
  sucursal_id TEXT NOT NULL,
  cantidad INTEGER NOT NULL,       -- unidades (> 0)
  efecto TEXT NOT NULL CHECK (efecto IN ('DESCUENTA','RESERVA')),
  PRIMARY KEY (outbox_id, variante_id)
);

-- Clave/valor: tienda_slug, tienda_json (marca), ultimo_sync_*, cupo_json, modo_sin_red
CREATE TABLE IF NOT EXISTS configuracion_sync (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  actualizado_en INTEGER NOT NULL
);

-- Idea 7: "Avisame cuando vuelva"
CREATE TABLE IF NOT EXISTS avisos_local (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL,
  variante_id TEXT NOT NULL, sucursal_id TEXT,   -- NULL = cualquier sucursal
  creado_en INTEGER NOT NULL, notificado_en INTEGER,
  UNIQUE (tenant_id, variante_id, sucursal_id)
);

-- Stock libre que ve la UI
CREATE VIEW IF NOT EXISTS v_stock_libre AS
SELECT s.tenant_id, s.variante_id, s.sucursal_id,
       s.disponible - s.reservada - IFNULL((
         SELECT SUM(i.cantidad) FROM outbox_items i JOIN outbox_local o ON o.id = i.outbox_id
         WHERE o.estado IN ('PENDIENTE','ENVIANDO')
           AND i.variante_id = s.variante_id AND i.sucursal_id = s.sucursal_id), 0) AS libre
FROM stock_local s;
`,
  },
];
