-- Fase 1 SaaS multi-tenant — backfill de los datos del Parcial 1 al inquilino "mirroria".
-- Idempotente. Se corre ANTES del primer arranque del backend nuevo (local y Azure):
-- synchronize no puede agregar un tenant_id NOT NULL a tablas con filas.
--   docker exec -i mirroria_postgres psql -U mirroria -d mirroria_db -v ON_ERROR_STOP=1 < scripts/sql/fase1-multitenant-backfill.sql
-- La columna queda idéntica a la de TenantBaseEntity (uuid, sin default, NOT NULL;
-- nullable en usuarios), así synchronize no la toca. Spec: vault U/2-2026/SI2/Parcial2/Fase1_Spec_MultiTenant.md §5.1
BEGIN;
DO $$
DECLARE
  t text;
  mirroria constant uuid := '00000000-0000-4000-a000-000000000001';
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'usuarios','sucursales','proveedores','categorias','temporadas','colecciones','tallas','colores',
    'productos','variantes_producto','inventario_sucursal','movimientos_inventario','ordenes_compra',
    'reservas','reserva_items','carritos','ventas','venta_items','pagos','cupones','interacciones_ia'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id uuid', t);
    EXECUTE format('UPDATE %I SET tenant_id = %L WHERE tenant_id IS NULL', t, mirroria);
    IF t <> 'usuarios' THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL', t);
    END IF;
  END LOOP;
END $$;
COMMIT;
