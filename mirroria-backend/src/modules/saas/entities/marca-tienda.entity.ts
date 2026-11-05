import { Check, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import type { DestinoCta, FuenteMarca, ModoMarca, RadioMarca } from '../marca/marca-reglas.js';
import { Inquilino } from './inquilino.entity.js';

/**
 * Marca de cada tienda (Fase 1b, 1:1 con `inquilinos`). Global como `suscripciones`: su
 * `inquilino_id` ES el tenant. La lista de fuentes y el contraste se validan en la app.
 */
@Entity('inquilino_marca')
@Check('CHK_marca_color_primario', `"color_primario" ~ '^#[0-9A-F]{6}$'`)
@Check('CHK_marca_color_acento', `"color_acento" ~ '^#[0-9A-F]{6}$'`)
@Check('CHK_marca_modo', `"modo" IN ('CLARO','OSCURO')`)
@Check('CHK_marca_radio', `"radio" IN ('RECTO','SUAVE','REDONDO')`)
@Check('CHK_marca_cta_destino', `"hero_cta_destino" IN ('CATALOGO','PROBADOR','SUCURSALES')`)
export class MarcaTienda extends BaseEntity {
  @OneToOne(() => Inquilino, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inquilino_id' })
  inquilino?: Inquilino;

  @Column({ name: 'inquilino_id', type: 'uuid' })
  inquilinoId!: string;

  @Column({ type: 'varchar', length: 20, default: 'grafito' })
  paleta!: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'favicon_url', type: 'varchar', length: 500, nullable: true })
  faviconUrl!: string | null;

  @Column({ name: 'color_primario', type: 'char', length: 7 })
  colorPrimario!: string;

  @Column({ name: 'color_acento', type: 'char', length: 7 })
  colorAcento!: string;

  @Column({ type: 'varchar', length: 10, default: 'CLARO' })
  modo!: ModoMarca;

  @Column({ type: 'varchar', length: 10, default: 'SUAVE' })
  radio!: RadioMarca;

  @Column({ type: 'varchar', length: 20, default: 'geist' })
  fuente!: FuenteMarca;

  @Column({ name: 'hero_imagen_url', type: 'varchar', length: 500 })
  heroImagenUrl!: string;

  @Column({ name: 'hero_titulo', type: 'varchar', length: 80 })
  heroTitulo!: string;

  @Column({ name: 'hero_subtitulo', type: 'varchar', length: 160, nullable: true })
  heroSubtitulo!: string | null;

  @Column({ name: 'hero_cta_texto', type: 'varchar', length: 24, default: 'Ver catálogo' })
  heroCtaTexto!: string;

  @Column({ name: 'hero_cta_destino', type: 'varchar', length: 12, default: 'CATALOGO' })
  heroCtaDestino!: DestinoCta;

  @Column({ name: 'hero_mostrar_probador', type: 'boolean', default: true })
  heroMostrarProbador!: boolean;

  @Column({ name: 'banner_sucursales_url', type: 'varchar', length: 500, nullable: true })
  bannerSucursalesUrl!: string | null;

  @Column({ name: 'imagen_probador_url', type: 'varchar', length: 500, nullable: true })
  imagenProbadorUrl!: string | null;

  @Column({ name: 'imagen_acceso_url', type: 'varchar', length: 500, nullable: true })
  imagenAccesoUrl!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  eslogan!: string | null;

  @Column({ name: 'sobre_nosotros', type: 'varchar', length: 600, nullable: true })
  sobreNosotros!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  instagram!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  facebook!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  tiktok!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsapp!: string | null;

  @Column({ name: 'email_contacto', type: 'varchar', length: 120, nullable: true })
  emailContacto!: string | null;

  @Column({ name: 'mostrar_insignia', type: 'boolean', default: true })
  mostrarInsignia!: boolean;
}
