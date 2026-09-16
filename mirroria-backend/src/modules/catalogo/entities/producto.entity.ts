import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Categoria } from './categoria.entity.js';
import { Coleccion } from './coleccion.entity.js';

export interface ImagenProducto {
  url: string;
  varianteId?: string;
  esArAsset: boolean;
  orden: number;
}

@Entity('productos')
export class Producto extends BaseEntity {
  @ManyToOne(() => Categoria, { nullable: false })
  @JoinColumn({ name: 'categoria_id' })
  categoria!: Categoria;

  // NOT NULL a propósito (ver Diseño_BD.md): garantiza que todo producto sea
  // trazable a un proveedor/temporada concretos vía su colección.
  @ManyToOne(() => Coleccion, { nullable: false })
  @JoinColumn({ name: 'coleccion_id' })
  coleccion!: Coleccion;

  @Column({ length: 255 })
  titulo!: string;

  @Index({ unique: true })
  @Column({ length: 280 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  // bigint en Postgres vuelve como string con el driver pg por defecto — se
  // transforma acá a number para que el JSON de la API dé un número real.
  // Precio de ropa nunca se acerca al límite seguro de Number, sin riesgo real.
  @Column({
    name: 'precio_cents',
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  precioCents!: number;

  @Column({ name: 'modelo_ar_url', type: 'varchar', length: 500, nullable: true })
  modeloArUrl!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  imagenes!: ImagenProducto[];

  @Column({ default: true })
  activo!: boolean;
}
