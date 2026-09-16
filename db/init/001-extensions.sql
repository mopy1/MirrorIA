-- Se ejecuta automáticamente por la imagen oficial de Postgres la primera vez
-- que se crea el volumen (docker-entrypoint-initdb.d). Requerido por
-- gen_random_uuid(), usado como default de todos los id uuid del esquema
-- (ver Diseño_BD.md / dbdiagram.dbml en el vault).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
