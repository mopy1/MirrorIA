-- Tablas y columnas del Parcial 2 que produccion no crea sola (synchronize apagado).
-- Se puede correr varias veces. Corre antes de levantar el backend nuevo:
--   docker exec -i mirroria_postgres psql -U mirroria -d mirroria_db -v ON_ERROR_STOP=1 < scripts/sql/parcial2-esquema.sql
BEGIN;

CREATE TABLE IF NOT EXISTS public.idempotencia (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  clave varchar(150) NOT NULL,
  ruta varchar(255) NOT NULL,
  metodo varchar(10) NOT NULL,
  hash_cuerpo varchar(64) NOT NULL,
  estado varchar(20) NOT NULL DEFAULT 'EN_PROCESO',
  codigo_estado integer,
  cuerpo_respuesta jsonb,
  expira_en timestamp NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uk_idempotencia_tenant_clave UNIQUE (tenant_id, clave)
);
CREATE INDEX IF NOT EXISTS idx_idempotencia_estado ON public.idempotencia (estado);
CREATE INDEX IF NOT EXISTS idx_idempotencia_expira_en ON public.idempotencia (expira_en);
CREATE INDEX IF NOT EXISTS idx_idempotencia_tenant_id ON public.idempotencia (tenant_id);

CREATE TABLE IF NOT EXISTS public.cobros_suscripcion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  inquilino_id uuid NOT NULL REFERENCES public.inquilinos (id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.planes (id) ON DELETE RESTRICT,
  proveedor_pago varchar(30) NOT NULL,
  metodo varchar(30) NOT NULL,
  monto_cents bigint NOT NULL,
  estado varchar(30) NOT NULL DEFAULT 'PENDIENTE',
  event_id varchar(150) NOT NULL UNIQUE,
  referencia_externa varchar(150),
  metadata jsonb
);
CREATE INDEX IF NOT EXISTS idx_cobros_suscripcion_estado ON public.cobros_suscripcion (estado);
CREATE INDEX IF NOT EXISTS idx_cobros_suscripcion_inquilino ON public.cobros_suscripcion (inquilino_id);
CREATE INDEX IF NOT EXISTS idx_cobros_suscripcion_ref_externa ON public.cobros_suscripcion (referencia_externa);

ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS clave_idempotencia varchar(128);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ventas_tenant_clave ON public.ventas (tenant_id, clave_idempotencia);

COMMIT;
