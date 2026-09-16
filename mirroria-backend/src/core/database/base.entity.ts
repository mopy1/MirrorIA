import { CreateDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Toda entidad de negocio principal debe extender de esta clase.
 * id como uuid con default `gen_random_uuid()` (pgcrypto) directo en Postgres —
 * a propósito NO se usa @PrimaryGeneratedColumn('uuid'), porque TypeORM lo
 * resuelve con la extensión uuid-ossp (uuid_generate_v4()), distinta a la que
 * documenta Diseño_BD.md/dbdiagram.dbml en el vault (pgcrypto).
 */
export abstract class BaseEntity {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
