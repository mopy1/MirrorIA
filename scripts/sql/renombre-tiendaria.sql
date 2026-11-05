-- 2026-11-05: intercambio de nombres. La plataforma SaaS pasa a llamarse MirrorIA y la tienda
-- principal (id fijo 00000000-0000-4000-a000-000000000001, antes "MirrorIA"/slug mirroria) pasa a
-- llamarse Tiendaria con slug `tiendaria`. Sus datos, cuentas (*@mirroria.com), plan y marca vino/rosa no cambian.
-- IDEMPOTENTE: se puede correr dos veces. Correrlo junto con el despliegue del código renombrado
-- (el seed busca la tienda por id, así que el orden no rompe nada).
--   docker exec -i mirroria_postgres psql -U mirroria -d mirroria_db -v ON_ERROR_STOP=1 < scripts/sql/renombre-tiendaria.sql
-- El código interno de paleta 'mirroria' (inquilino_marca.paleta) se deja tal cual: no es visible.

BEGIN;

UPDATE "inquilinos" SET "nombre" = 'Tiendaria', "slug" = 'tiendaria'
 WHERE "id" = '00000000-0000-4000-a000-000000000001' AND ("nombre" <> 'Tiendaria' OR "slug" <> 'tiendaria');

-- Logo: el SVG se renombró (mismo dibujo, <title> Tiendaria).
UPDATE "inquilino_marca" SET "logo_url" = '/images/marcas/tiendaria.svg'
 WHERE "logo_url" = '/images/marcas/mirroria.svg';

-- Textos visibles de la marca de esa tienda que todavía digan "MirrorIA".
UPDATE "inquilino_marca"
   SET "hero_titulo"    = replace("hero_titulo", 'MirrorIA', 'Tiendaria'),
       "hero_subtitulo" = replace("hero_subtitulo", 'MirrorIA', 'Tiendaria'),
       "hero_cta_texto" = replace("hero_cta_texto", 'MirrorIA', 'Tiendaria'),
       "eslogan"        = replace("eslogan", 'MirrorIA', 'Tiendaria'),
       "sobre_nosotros" = replace("sobre_nosotros", 'MirrorIA', 'Tiendaria')
 WHERE "inquilino_id" = '00000000-0000-4000-a000-000000000001'
   AND concat_ws(' ', "hero_titulo", "hero_subtitulo", "hero_cta_texto", "eslogan", "sobre_nosotros") LIKE '%MirrorIA%';

COMMIT;

SELECT i."nombre", i."slug", m."logo_url" FROM "inquilinos" i
  LEFT JOIN "inquilino_marca" m ON m."inquilino_id" = i."id"
 WHERE i."id" = '00000000-0000-4000-a000-000000000001';
