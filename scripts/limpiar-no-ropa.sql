-- Borra de la base las dos categorias que no son ropa y todo lo que colgaba
-- de ellas (calzado y bijouterie).
--
-- POR QUE HACE FALTA SQL: `categorias` solo tiene POST y GET en el backend —
-- no hay PATCH ni DELETE—, asi que una categoria creada no se puede ni
-- renombrar ni sacar desde la app. Los PRODUCTOS si se pudieron retirar por
-- API (quedaron con activo=false y ya no se ven en la tienda); lo que sigue
-- apareciendo son las dos categorias vacias, en el menu y en los filtros.
--
--   docker compose exec -T db psql -U mirroria -d mirroria < scripts/limpiar-no-ropa.sql
--
-- Correr DESPUES de sembrar-catalogo.mjs, que es el que desactiva los
-- productos. Si alguno tuviera ventas o reservas asociadas el borrado falla
-- por clave foranea: en ese caso alcanza con dejarlos desactivados y borrar
-- solo las categorias (el ultimo DELETE), que es lo que se ve.

BEGIN;

CREATE TEMP TABLE _a_borrar AS
  SELECT p.id
    FROM productos p
    JOIN categorias c ON c.id = p.categoria_id
   WHERE c.slug IN ('calzado', 'joyeria-y-accesorios');

-- De adentro hacia afuera, respetando las claves foraneas.
DELETE FROM movimientos_inventario
 WHERE variante_id IN (SELECT id FROM variantes_producto WHERE producto_id IN (SELECT id FROM _a_borrar));

DELETE FROM inventario_sucursal
 WHERE variante_id IN (SELECT id FROM variantes_producto WHERE producto_id IN (SELECT id FROM _a_borrar));

DELETE FROM variantes_producto WHERE producto_id IN (SELECT id FROM _a_borrar);

DELETE FROM productos WHERE id IN (SELECT id FROM _a_borrar);

DELETE FROM categorias WHERE slug IN ('calzado', 'joyeria-y-accesorios');

COMMIT;

-- Comprobacion: tienen que quedar 4 categorias, todas de ropa.
SELECT nombre, slug FROM categorias ORDER BY nombre;
SELECT count(*) AS productos_activos FROM productos WHERE activo = true;
