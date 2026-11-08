import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import type { ExportarReporteDto } from '../dto/exportar-reporte.dto.js';
import {
  ExportadorExcelService,
  METRICAS_MONETARIAS,
  type ParametrosWorkbook,
} from './exportador-excel.service.js';

const INDIGO = '#312E81';
const GRIS = '#6B7280';
const TEXTO = '#111827';
const CEBRA = '#F9FAFB';
const MARGEN = 50;
const ALTO_FILA = 20;
/** Sumar promedios da un numero sin sentido. */
const SIN_TOTAL = new Set(['ticket_promedio']);

/** Mismo contenido que el Excel, listo para imprimir o mandar. */
@Injectable()
export class ExportadorPdfService {
  constructor(private readonly excel: ExportadorExcelService) {}

  async generarDocumento(dto: ExportarReporteDto, usuario: string, user?: JwtPayload): Promise<Buffer> {
    return this.dibujar(await this.excel.prepararDatos(dto, usuario, user));
  }

  private dibujar(datos: ParametrosWorkbook): Promise<Buffer> {
    const { ficha, filas, comparacion, nombreTienda, usuarioGenerador } = datos;
    const doc = new PDFDocument({ size: 'A4', margin: MARGEN, bufferPages: true });
    const partes: Buffer[] = [];
    const listo = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (p: Buffer) => partes.push(p));
      doc.on('end', () => resolve(Buffer.concat(partes)));
      doc.on('error', reject);
    });

    const moneda = METRICAS_MONETARIAS.has(ficha.metrica);
    const valor = (n: number) =>
      moneda
        ? `Bs ${(n / 100).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : n.toLocaleString('es-BO');
    const conComparacion = Boolean(comparacion?.variaciones?.length);
    const ancho = doc.page.width - MARGEN * 2;
    const columnas = conComparacion
      ? [{ t: 'Concepto', w: ancho * 0.4 }, { t: 'Valor actual', w: ancho * 0.22 }, { t: 'Período anterior', w: ancho * 0.22 }, { t: 'Variación', w: ancho * 0.16 }]
      : [{ t: 'Concepto', w: ancho * 0.65 }, { t: 'Valor', w: ancho * 0.35 }];

    doc.fillColor(INDIGO).font('Helvetica-Bold').fontSize(16).text(nombreTienda.toUpperCase());
    doc.moveDown(0.3).fillColor(TEXTO).fontSize(12)
      .text(datos.titulo ?? `Reporte de ${ficha.metrica} agrupado por ${ficha.agruparPor}`);
    doc.moveDown(0.3).fillColor(GRIS).font('Helvetica-Oblique').fontSize(9)
      .text(`Filtros: ${this.excel.resumirFiltros(ficha)}`)
      .text(`Generado por ${usuarioGenerador} el ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC`);
    doc.moveDown(1);

    const fila = (celdas: string[], opciones: { fondo?: string; color?: string; negrita?: boolean } = {}) => {
      const y = doc.y;
      if (opciones.fondo) doc.rect(MARGEN, y, ancho, ALTO_FILA).fill(opciones.fondo);
      doc.fillColor(opciones.color ?? TEXTO).font(opciones.negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
      let x = MARGEN;
      celdas.forEach((texto, i) => {
        doc.text(texto, x + 6, y + 6, {
          width: columnas[i].w - 12,
          align: i === 0 ? 'left' : 'right',
          lineBreak: false,
          ellipsis: true,
          height: ALTO_FILA,
        });
        x += columnas[i].w;
      });
      doc.x = MARGEN;
      doc.y = y + ALTO_FILA;
    };
    const encabezado = () => fila(columnas.map((c) => c.t), { fondo: INDIGO, color: '#FFFFFF', negrita: true });
    const limite = doc.page.height - MARGEN - ALTO_FILA * 2;

    encabezado();
    if (filas.length === 0) {
      doc.moveDown(1).fillColor(GRIS).font('Helvetica-Oblique').fontSize(10)
        .text('No se encontraron datos para los filtros seleccionados.', MARGEN);
    }
    filas.forEach((f, i) => {
      if (doc.y > limite) {
        doc.addPage();
        encabezado();
      }
      const celdas = [f.etiqueta, valor(f.valor)];
      if (conComparacion) {
        const v = comparacion?.variaciones?.find((x) => x.clave === f.clave);
        celdas.push(
          v ? valor(v.anterior) : '—',
          v?.deltaPorcentual != null ? `${v.deltaPorcentual > 0 ? '+' : ''}${v.deltaPorcentual.toFixed(1)}%` : '—',
        );
      }
      fila(celdas, { fondo: i % 2 === 1 ? CEBRA : undefined });
    });
    if (filas.length > 0 && !SIN_TOTAL.has(ficha.metrica)) {
      if (doc.y > limite) doc.addPage();
      const total = filas.reduce((a, f) => a + f.valor, 0);
      fila(['TOTAL GENERAL', valor(total), ...(conComparacion ? ['', ''] : [])], { negrita: true });
    }

    const { start, count } = doc.bufferedPageRange();
    for (let i = start; i < start + count; i++) {
      doc.switchToPage(i);
      doc.fillColor(GRIS).font('Helvetica').fontSize(8)
        .text(`MirrorIA · Página ${i - start + 1} de ${count}`, MARGEN, doc.page.height - MARGEN + 10, {
          width: ancho, align: 'center', lineBreak: false, height: 12,
        });
    }
    doc.end();
    return listo;
  }
}
