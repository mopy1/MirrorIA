-- Fase 1b (Tiendaria): marca por tienda, niveles de marca de los planes y bitácora de la plataforma.
-- Para Azure (NODE_ENV=production, sin synchronize). Local no lo necesita: synchronize lo crea.
-- IDEMPOTENTE: se puede correr dos veces. Correrlo ANTES de levantar el backend nuevo
-- (después, SaasSeedService completa la marca inicial de cualquier tienda que no la tenga).
--   docker exec -i mirroria_postgres psql -U mirroria -d mirroria_db -v ON_ERROR_STOP=1 < scripts/sql/fase1b-marca.sql
-- Los nombres de PK/FK/CHECK/índices son los que genera TypeORM (así un synchronize futuro no emite DDL).

BEGIN;

-- 1. planes: nivel de marca + destacado ------------------------------------------------------
ALTER TABLE "planes" ADD COLUMN IF NOT EXISTS "nivel_marca" character varying(20) NOT NULL DEFAULT 'ESENCIAL';
ALTER TABLE "planes" ADD COLUMN IF NOT EXISTS "destacado" boolean NOT NULL DEFAULT false;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CHK_planes_nivel_marca') THEN
    ALTER TABLE "planes" ADD CONSTRAINT "CHK_planes_nivel_marca"
      CHECK ("nivel_marca" IN ('ESENCIAL','COMPLETA','MARCA_BLANCA'));
  END IF;
END $$;
-- Mapeo base solo si nadie lo configuró todavía (misma regla que SaasSeedService.nivelesDeMarca).
UPDATE "planes" p SET "nivel_marca" = v.nivel, "destacado" = v.destacado
  FROM (VALUES ('basico', 'ESENCIAL', false), ('crecimiento', 'COMPLETA', true), ('cadena', 'MARCA_BLANCA', false))
       AS v(codigo, nivel, destacado)
 WHERE p.codigo = v.codigo
   AND NOT EXISTS (SELECT 1 FROM "planes" WHERE "nivel_marca" <> 'ESENCIAL' OR "destacado");

-- 2. inquilino_marca (1:1 con inquilinos) -----------------------------------------------------
CREATE TABLE IF NOT EXISTS "inquilino_marca" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "inquilino_id" uuid NOT NULL,
  "paleta" character varying(20) NOT NULL DEFAULT 'grafito',
  "logo_url" character varying(500),
  "favicon_url" character varying(500),
  "color_primario" character(7) NOT NULL,
  "color_acento" character(7) NOT NULL,
  "modo" character varying(10) NOT NULL DEFAULT 'CLARO',
  "radio" character varying(10) NOT NULL DEFAULT 'SUAVE',
  "fuente" character varying(20) NOT NULL DEFAULT 'geist',
  "hero_imagen_url" character varying(500) NOT NULL,
  "hero_titulo" character varying(80) NOT NULL,
  "hero_subtitulo" character varying(160),
  "hero_cta_texto" character varying(24) NOT NULL DEFAULT 'Ver catálogo',
  "hero_cta_destino" character varying(12) NOT NULL DEFAULT 'CATALOGO',
  "hero_mostrar_probador" boolean NOT NULL DEFAULT true,
  "banner_sucursales_url" character varying(500),
  "imagen_probador_url" character varying(500),
  "imagen_acceso_url" character varying(500),
  "eslogan" character varying(120),
  "sobre_nosotros" character varying(600),
  "instagram" character varying(60),
  "facebook" character varying(60),
  "tiktok" character varying(60),
  "whatsapp" character varying(20),
  "email_contacto" character varying(120),
  "mostrar_insignia" boolean NOT NULL DEFAULT true,
  CONSTRAINT "REL_48885ce9db8c53f8843b356ff2" UNIQUE ("inquilino_id"),
  CONSTRAINT "CHK_marca_cta_destino" CHECK ("hero_cta_destino" IN ('CATALOGO','PROBADOR','SUCURSALES')),
  CONSTRAINT "CHK_marca_radio" CHECK ("radio" IN ('RECTO','SUAVE','REDONDO')),
  CONSTRAINT "CHK_marca_modo" CHECK ("modo" IN ('CLARO','OSCURO')),
  CONSTRAINT "CHK_marca_color_acento" CHECK ("color_acento" ~ '^#[0-9A-F]{6}$'),
  CONSTRAINT "CHK_marca_color_primario" CHECK ("color_primario" ~ '^#[0-9A-F]{6}$'),
  CONSTRAINT "PK_a10b312781d271397dd7e38fd95" PRIMARY KEY ("id"),
  CONSTRAINT "FK_48885ce9db8c53f8843b356ff2f" FOREIGN KEY ("inquilino_id")
    REFERENCES "inquilinos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- 3. eventos_plataforma (bitácora, solo inserts) ---------------------------------------------
CREATE TABLE IF NOT EXISTS "eventos_plataforma" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "inquilino_id" uuid NOT NULL,
  "tipo" character varying(30) NOT NULL,
  "detalle" character varying(255),
  "actor_id" uuid,
  "actor_rol" character varying(20) NOT NULL,
  CONSTRAINT "PK_b000729da9468007d7110d4fe69" PRIMARY KEY ("id"),
  CONSTRAINT "FK_2e2a19a857736cbd22097e8a049" FOREIGN KEY ("inquilino_id")
    REFERENCES "inquilinos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX IF NOT EXISTS "IDX_eventos_plataforma_inquilino_fecha" ON "eventos_plataforma" ("inquilino_id", "createdAt");

-- 4. Marca de MirrorIA (se ve exactamente como antes de la fase) ----------------------------
INSERT INTO "inquilino_marca" (
  "inquilino_id", "paleta", "logo_url", "color_primario", "color_acento", "modo", "radio", "fuente",
  "hero_imagen_url", "hero_titulo", "hero_subtitulo", "hero_cta_texto", "hero_cta_destino", "hero_mostrar_probador",
  "banner_sucursales_url", "imagen_probador_url", "imagen_acceso_url", "eslogan", "mostrar_insignia")
SELECT '00000000-0000-4000-a000-000000000001', 'mirroria', '/images/marcas/mirroria.svg', '#820025', '#EDA6C1',
       'CLARO', 'SUAVE', 'geist', '/images/hero-model.webp',
       'Mírate con la prenda puesta, antes de decidir.',
       'Explorá el catálogo, reservá tu talla en la sucursal más cercana y probátela en persona cuando quieras.',
       'Ver catálogo', 'CATALOGO', true,
       'https://images.unsplash.com/photo-1761090617068-f1b3257d27ad?w=1600&h=700&fit=crop&q=80&auto=format',
       'https://images.unsplash.com/photo-1753161027818-28b1f73a8fdf?w=1200&h=900&fit=crop&q=80&auto=format',
       'https://images.unsplash.com/photo-1759630752910-c4f9f628cf88?w=1200&h=1600&fit=crop&q=80&auto=format',
       'Moda femenina con vestidor virtual', true
 WHERE EXISTS (SELECT 1 FROM "inquilinos" WHERE "id" = '00000000-0000-4000-a000-000000000001')
ON CONFLICT ("inquilino_id") DO NOTHING;

COMMIT;
