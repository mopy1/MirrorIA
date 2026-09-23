-- Corrige los textos que el API NO permite editar.
--
-- `categorias`, `tallas`, `temporadas` y `sucursales` solo tienen POST y GET:
-- no existe PATCH en ningun controller, asi que un nombre mal escrito no se
-- puede arreglar desde la app ni desde el panel admin. Esto se corre una vez
-- contra la base de produccion y queda resuelto.
--
--   docker compose exec -T db psql -U mirroria -d mirroria < scripts/corregir-acentos.sql
--
-- (ajustar usuario/base si el compose usa otros; ver docker-compose.yml)

BEGIN;

-- 1. La categoria visible en el menu y en los filtros de la tienda.
UPDATE categorias
   SET nombre = 'Joyería y accesorios'
 WHERE slug = 'joyeria-y-accesorios';

-- 2. Talla 'Unica' -> 'Única'. Primero se borra la fila duplicada que quedo
--    sin usar (la creo el sembrador al corregir el nombre), y recien despues
--    se renombra la que si usan las variantes; al reves chocaria con el
--    indice unico de nombre.
DELETE FROM tallas
 WHERE nombre = 'Única'
   AND id NOT IN (SELECT talla_id FROM variantes_producto);

UPDATE tallas SET nombre = 'Única' WHERE nombre = 'Unica';

-- 3. Misma historia con la temporada (el guion corto paso a guion largo).
DELETE FROM temporadas
 WHERE nombre = 'Primavera–Verano 2026/2027'
   AND id NOT IN (SELECT temporada_id FROM colecciones);

UPDATE temporadas
   SET nombre = 'Primavera–Verano 2026/2027'
 WHERE nombre = 'Primavera-Verano 2026/2027';

-- 4. Direcciones de las sucursales, que se ven en /sucursales y en el inicio.
UPDATE sucursales SET direccion = replace(direccion, 'San Martin', 'San Martín');
UPDATE sucursales SET direccion = replace(direccion, 'Ballivian', 'Ballivián');

COMMIT;

-- Comprobacion
SELECT 'categorias' AS tabla, nombre FROM categorias WHERE slug = 'joyeria-y-accesorios'
UNION ALL SELECT 'tallas', nombre FROM tallas WHERE nombre LIKE 'Un%' OR nombre LIKE 'Ún%'
UNION ALL SELECT 'temporadas', nombre FROM temporadas
UNION ALL SELECT 'sucursales', direccion FROM sucursales;
