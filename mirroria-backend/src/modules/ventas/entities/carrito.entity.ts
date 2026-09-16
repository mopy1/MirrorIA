import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

export interface CarritoItem {
  varianteId: string;
  cantidad: number;
}

@Entity('carritos')
export class Carrito extends BaseEntity {
  // Cross-módulo (seguridad) como columna simple. Unique a propósito (no
  // documentado así en Diseño_BD.md, decisión propia): un solo carrito
  // activo por usuario, se muta el mismo row en vez de crear filas nuevas en
  // cada add-to-cart — evita duplicados sin necesitar un campo `activo`.
  @Index({ unique: true })
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  items!: CarritoItem[];
}
