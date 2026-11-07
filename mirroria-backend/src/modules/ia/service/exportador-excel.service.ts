import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import ExcelJS from 'exceljs';
import { contextoTenant, tenantActual } from '../../../core/tenancy/tenant-context.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { SinSucursalAsignadaException } from '../exception/sin-sucursal-asignada.exception.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { ExportarReporteDto } from '../dto/exportar-reporte.dto.js';
import { ReporteResponseDto, type ComparacionDto } from '../dto/reporte-response.dto.js';
import { MotorConsultaService, type FilaReporte } from './motor-consulta.service.js';
import { CATALOGO_METRICAS } from './catalogo-metricas.js';

export const METRICAS_MONETARIAS = new Set([
  'ingresos',
  'ticket_promedio',
  'descuentos',
  'descuento_por_cupon',
]);

const FORMATO_MONEDA_BS = '"Bs" #,##0.00;[Red]-"Bs" #,##0.00;"Bs" 0.00';
const FORMATO_ENTERO = '#,##0';
const FORMATO_PORCENTAJE = '+0.0%;-0.0%;0.0%';

export interface ParametrosWorkbook {
  ficha: FichaConsultaDto;
  filas: FilaReporte[];
  comparacion?: ComparacionDto | null;
  titulo?: string;
  nombreTienda: string;
  usuarioGenerador: string;
}

@Injectable()
export class ExportadorExcelService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly motorConsulta: MotorConsultaService,
  ) {}

  /**
   * Generar reporte Excel a partir de un ReporteResponseDto estructurado.
   */
  async generarReporteExcel(params: {
    reporte: ReporteResponseDto;
    nombreTienda?: string;
    usuarioGenerador?: string;
    titulo?: string;
  }): Promise<Buffer> {
    const { reporte, usuarioGenerador = 'Usuario' } = params;
    const nombreTienda = await this.resolverNombreTienda(params.nombreTienda);

    return this.construirWorkbook({
      ficha: reporte.ficha,
      filas: reporte.filas,
      comparacion: reporte.comparacion,
      titulo: params.titulo,
      nombreTienda,
      usuarioGenerador,
    });
  }

  /**
   * Generar reporte Excel a partir de ExportarReporteDto (ejecuta consulta si no vienen filas).
   */
  async generarLibro(
    dto: ExportarReporteDto,
    usuarioNombre: string,
    user?: JwtPayload,
  ): Promise<Buffer> {
    return this.construirWorkbook(await this.prepararDatos(dto, usuarioNombre, user));
  }

  /** Lo que comparten Excel y PDF: alcance de sucursal, tienda y filas. */
  async prepararDatos(
    dto: ExportarReporteDto,
    usuarioNombre: string,
    user?: JwtPayload,
  ): Promise<ParametrosWorkbook> {
    const ficha = dto.ficha ?? dto.reporte?.ficha;
    if (!ficha) {
      throw new CombinacionInvalidaException('Debe proporcionar una ficha o un reporte para exportar');
    }

    // Forzar alcance de sucursal si el usuario es ENCARGADO_SUCURSAL y no vienen filas
    if (user?.role === 'ENCARGADO_SUCURSAL' && !dto.filas && !dto.reporte?.filas) {
      if (!user.sucursalId) throw new SinSucursalAsignadaException();
      if (CATALOGO_METRICAS[ficha.metrica]?.filtros.sucursalId) {
        ficha.filtros = { ...ficha.filtros, sucursalId: user.sucursalId };
      }
    }

    // El nombre lo pone el servidor: si no, se podía emitir el reporte a nombre de otra tienda.
    const nombreTienda = await this.resolverNombreTienda();
    const filas: FilaReporte[] =
      dto.filas ?? dto.reporte?.filas ?? (await this.motorConsulta.ejecutar(ficha));
    const comparacion: ComparacionDto | null =
      dto.comparacion ?? dto.reporte?.comparacion ?? null;

    return {
      ficha,
      filas,
      comparacion,
      titulo: dto.titulo,
      nombreTienda,
      usuarioGenerador: usuarioNombre,
    };
  }

  private async resolverNombreTienda(nombreExplicito?: string): Promise<string> {
    if (nombreExplicito) return nombreExplicito;

    const store = contextoTenant();
    if (store?.nombre) return store.nombre;

    try {
      const tenantId = tenantActual();
      const [tienda] = (await this.dataSource.query(
        'SELECT nombre FROM inquilinos WHERE id = $1',
        [tenantId],
      )) as Array<{ nombre: string }>;
      return tienda?.nombre ?? 'MirrorIA Boutique';
    } catch {
      return 'MirrorIA Boutique';
    }
  }

  private async construirWorkbook(params: ParametrosWorkbook): Promise<Buffer> {
    const { ficha, filas, comparacion, nombreTienda, usuarioGenerador } = params;
    const esMonetario = METRICAS_MONETARIAS.has(ficha.metrica);
    const tieneComparacion = Boolean(comparacion?.variaciones && comparacion.variaciones.length > 0);
    const maxCols = tieneComparacion ? 4 : 2;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MirrorIA Analytics Engine';
    workbook.lastModifiedBy = usuarioGenerador;
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Reporte', {
      views: [{ showGridLines: true }],
    });

    // 1. Cabecera Institucional
    // Fila 1: Nombre de la Tienda
    sheet.mergeCells(1, 1, 1, maxCols);
    const cellTienda = sheet.getCell('A1');
    cellTienda.value = nombreTienda.toUpperCase();
    cellTienda.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF312E81' } };
    cellTienda.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(1).height = 28;

    // Fila 2: Título del Reporte
    sheet.mergeCells(2, 1, 2, maxCols);
    const cellTitulo = sheet.getCell('A2');
    const titulo =
      params.titulo ?? `Reporte de ${ficha.metrica} agrupado por ${ficha.agruparPor}`;
    cellTitulo.value = titulo;
    cellTitulo.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1F2937' } };
    cellTitulo.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(2).height = 22;

    // Fila 3: Metadatos y Auditoría
    sheet.mergeCells(3, 1, 3, maxCols);
    const cellMeta = sheet.getCell('A3');
    const filtrosDesc = this.resumirFiltros(ficha);
    const fechaGen = new Date().toISOString().replace('T', ' ').slice(0, 19);
    cellMeta.value = `Filtros: ${filtrosDesc} | Generado por: ${usuarioGenerador} (${fechaGen})`;
    cellMeta.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF6B7280' } };
    cellMeta.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(3).height = 18;

    // Fila 4: Espacio en blanco
    sheet.addRow([]);

    // 2. Encabezados de Tabla (Fila 5)
    const encabezados = ['Concepto', 'Valor Actual'];
    if (tieneComparacion) {
      encabezados.push('Período Anterior', 'Variación (%)');
    }
    const filaHeader = sheet.addRow(encabezados);
    filaHeader.height = 24;

    filaHeader.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF312E81' }, // Índigo MirrorIA
      };
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'right' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      };
    });

    // 3. Filas de Datos
    const inicioFilaDatos = 6;
    if (filas.length === 0) {
      const filaVacia = sheet.addRow(['No se encontraron datos para los filtros seleccionados']);
      sheet.mergeCells(inicioFilaDatos, 1, inicioFilaDatos, maxCols);
      filaVacia.getCell(1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF6B7280' } };
      filaVacia.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      filaVacia.height = 22;
    } else {
      filas.forEach((fila, index) => {
        const valorReal = esMonetario ? fila.valor / 100 : fila.valor;
        const valoresFila: (string | number)[] = [fila.etiqueta, valorReal];

        let vComp = comparacion?.variaciones?.find((v) => v.clave === fila.clave);
        if (tieneComparacion) {
          const anteriorReal = vComp ? (esMonetario ? vComp.anterior / 100 : vComp.anterior) : 0;
          valoresFila.push(anteriorReal);
          const deltaPct = vComp?.deltaPorcentual != null ? vComp.deltaPorcentual / 100 : 0;
          valoresFila.push(deltaPct);
        }

        const row = sheet.addRow(valoresFila);
        row.height = 20;

        // Estilo Cebra
        const bgZebra = index % 2 === 1 ? 'FFF9FAFB' : 'FFFFFFFF';
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgZebra } };
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF111827' } };
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };

          if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          } else if (colNumber === 2 || colNumber === 3) {
            cell.numFmt = esMonetario ? FORMATO_MONEDA_BS : FORMATO_ENTERO;
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          } else if (colNumber === 4) {
            cell.numFmt = FORMATO_PORCENTAJE;
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            if (typeof cell.value === 'number') {
              if (cell.value > 0) cell.font = { color: { argb: 'FF059669' }, bold: true };
              else if (cell.value < 0) cell.font = { color: { argb: 'FFDC2626' }, bold: true };
            }
          }
        });
      });

      const finFilaDatos = inicioFilaDatos + filas.length - 1;

      // 4. Fila de Totales con Fórmulas Nativas
      const filaTotales = sheet.addRow([]);
      filaTotales.height = 24;

      const cellLabel = filaTotales.getCell(1);
      cellLabel.value = 'TOTAL GENERAL';
      cellLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E1B4B' } };
      cellLabel.alignment = { vertical: 'middle', horizontal: 'left' };

      const cellSumActual = filaTotales.getCell(2);
      cellSumActual.value = { formula: `SUM(B${inicioFilaDatos}:B${finFilaDatos})` };
      cellSumActual.numFmt = esMonetario ? FORMATO_MONEDA_BS : FORMATO_ENTERO;
      cellSumActual.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E1B4B' } };
      cellSumActual.alignment = { vertical: 'middle', horizontal: 'right' };

      if (tieneComparacion) {
        const cellSumAnt = filaTotales.getCell(3);
        cellSumAnt.value = { formula: `SUM(C${inicioFilaDatos}:C${finFilaDatos})` };
        cellSumAnt.numFmt = esMonetario ? FORMATO_MONEDA_BS : FORMATO_ENTERO;
        cellSumAnt.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E1B4B' } };
        cellSumAnt.alignment = { vertical: 'middle', horizontal: 'right' };

        const totalRowNum = finFilaDatos + 1;
        const cellVariacionTotal = filaTotales.getCell(4);
        cellVariacionTotal.value = {
          formula: `IF(C${totalRowNum}=0, 0, (B${totalRowNum}-C${totalRowNum})/C${totalRowNum})`,
        };
        cellVariacionTotal.numFmt = FORMATO_PORCENTAJE;
        cellVariacionTotal.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E1B4B' } };
        cellVariacionTotal.alignment = { vertical: 'middle', horizontal: 'right' };
      }

      // Bordes Contables Dobles
      filaTotales.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
          bottom: { style: 'double', color: { argb: 'FF1F2937' } }, // Doble raya contable
        };
      });
    }

    // 5. Auto-fit de anchos de columna
    sheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        let textLen = 0;
        if (cell.value != null) {
          if (typeof cell.value === 'object' && 'formula' in cell.value) {
            textLen = 14; // Ancho estimado para sumatorias numéricas
          } else {
            textLen = String(cell.value).length;
          }
        }
        if (textLen > maxLen) maxLen = textLen;
      });
      column.width = Math.max(16, Math.min(maxLen + 3, 50));
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  resumirFiltros(ficha: FichaConsultaDto): string {
    const f = ficha.filtros ?? {};
    const partes: string[] = [];
    if (f.desde || f.hasta) partes.push(`Fechas: ${f.desde ?? 'inicio'} a ${f.hasta ?? 'hoy'}`);
    if (f.canal) partes.push(`Canal: ${f.canal}`);
    if (f.metodoPago) partes.push(`Método: ${f.metodoPago}`);
    if (f.proveedorPago) partes.push(`Pasarela: ${f.proveedorPago}`);
    if (f.estado) partes.push(`Estado: ${f.estado}`);
    return partes.length > 0 ? partes.join(' | ') : 'Sin filtros adicionales';
  }
}
