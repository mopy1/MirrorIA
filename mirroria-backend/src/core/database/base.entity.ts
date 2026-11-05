import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Toda entidad de negocio principal debe extender de esta clase.
 * id como uuid con default `gen_random_uuid()` (pgcrypto) directo en Postgres:
 * `@PrimaryGeneratedColumn('uuid')` + `uuidExtension: 'pgcrypto'` en typeorm.config.ts.
 * No usar `@PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })`: TypeORM 1.x
 * lee esa columna como "generada" y la de la entidad como "no generada", y en cada
 * arranque con synchronize emitía DROP/SET DEFAULT + DROP/ADD de las FK en todas las tablas.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
