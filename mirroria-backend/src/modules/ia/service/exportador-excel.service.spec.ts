import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { DataSource } from 'typeorm';
import ExcelJS from 'exceljs';
import { ExportadorExcelService } from './exportador-excel.service.js';
import { MotorConsultaService, type FilaReporte } from './motor-consulta.service.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import { ExportarReporteDto } from '../dto/exportar-reporte.dto.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';

describe('ExportadorExcelService', () => {
  let dataSource: { query: ReturnType<typeof vi.fn> };
  let motorConsulta: { ejecutar: ReturnType<typeof vi.fn> };
  let service: ExportadorExcelService;

  beforeEach(() => {
    dataSource = {
      query: vi.fn().mockResolvedValue([{ nombre: 'Tiendaria Boutique' }]),
    };
    motorConsulta = {
      ejecutar: vi.fn().mockResolvedValue([
        { clave: 's1', etiqueta: 'Sucursal Central', valor: 250000 },
        { clave: 's2', etiqueta: 'Sucursal Norte', valor: 150000 },
      ] as FilaReporte[]),
    };
    service = new ExportadorExcelService(
      dataSource as unknown as DataSource,
      motorConsulta as unknown as MotorConsultaService,
    );
  });

  it('genera un libro Excel (.xlsx) estructurado para métricas monetarias', async () => {
    const ficha: FichaConsultaDto = {
      metrica: 'ingresos',
      agruparPor: 'sucursal',
      filtros: { desde: '2026-08-01', hasta: '2026-08-31', canal: 'WEB' },
      orden: 'desc',
      limite: 20,
    };
    const filas: FilaReporte[] = [
      { clave: 's1', etiqueta: 'Sucursal Central', valor: 250000 }, // Bs 2,500.00
      { clave: 's2', etiqueta: 'Sucursal Norte', valor: 150000 },   // Bs 1,500.00
    ];
    const reporte: ReporteResponseDto = {
      ficha,
      filas,
      comparacion: null,
      narrativa: null,
    };

    const buffer = await service.generarReporteExcel({
      reporte,
      nombreTienda: 'Tiendaria - Moda Femenina',
      usuarioGenerador: 'admin@tiendaria.com',
      titulo: 'Ingresos Netos por Sucursal',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);

    // Cargar con ExcelJS y verificar estructura de celdas
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);

    const sheet = wb.getWorksheet('Reporte');
    expect(sheet).toBeDefined();

    // Fila 1: Nombre de la tienda institucional
    const celdaTienda = sheet!.getCell('A1');
    expect(celdaTienda.value).toBe('TIENDARIA - MODA FEMENINA');
    expect(celdaTienda.font?.size).toBe(16);
    expect(celdaTienda.font?.bold).toBe(true);
    expect(celdaTienda.font?.color?.argb).toBe('FF312E81');

    // Fila 2: Título del reporte
    const celdaTitulo = sheet!.getCell('A2');
    expect(celdaTitulo.value).toBe('Ingresos Netos por Sucursal');
    expect(celdaTitulo.font?.size).toBe(12);
    expect(celdaTitulo.font?.bold).toBe(true);

    // Fila 3: Metadatos y filtros
    const celdaMeta = sheet!.getCell('A3');
    expect(String(celdaMeta.value)).toContain('Fechas: 2026-08-01 a 2026-08-31');
    expect(String(celdaMeta.value)).toContain('Canal: WEB');
    expect(String(celdaMeta.value)).toContain('Generado por: admin@tiendaria.com');

    // Fila 5: Encabezados
    expect(sheet!.getCell('A5').value).toBe('Concepto');
    expect(sheet!.getCell('B5').value).toBe('Valor Actual');
    expect(sheet!.getCell('A5').fill).toMatchObject({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF312E81' },
    });

    // Filas 6 y 7: Datos convertidos de centavos a unidades monetarias reales
    const fila1 = sheet!.getRow(6);
    expect(fila1.getCell(1).value).toBe('Sucursal Central');
    expect(fila1.getCell(2).value).toBe(2500); // 250000 / 100
    expect(fila1.getCell(2).numFmt).toContain('"Bs"');

    const fila2 = sheet!.getRow(7);
    expect(fila2.getCell(1).value).toBe('Sucursal Norte');
    expect(fila2.getCell(2).value).toBe(1500); // 150000 / 100

    // Fila 8: Fila de Totales con fórmula viva SUM
    const filaTotales = sheet!.getRow(8);
    expect(filaTotales.getCell(1).value).toBe('TOTAL GENERAL');
    expect(filaTotales.getCell(2).value).toEqual({ formula: 'SUM(B6:B7)' });
    expect(filaTotales.getCell(2).numFmt).toContain('"Bs"');
    expect(filaTotales.getCell(2).border?.bottom?.style).toBe('double'); // Doble raya contable
  });

  it('exporta comparación histórica con columnas de período anterior y variación porcentual', async () => {
    const ficha: FichaConsultaDto = {
      metrica: 'ingresos',
      agruparPor: 'sucursal',
      filtros: { desde: '2026-08-01', hasta: '2026-08-31' },
      orden: 'desc',
      limite: 20,
    };
    const filas: FilaReporte[] = [
      { clave: 's1', etiqueta: 'Sucursal Central', valor: 200000 }, // Actual: 2,000.00
    ];
    const reporte: ReporteResponseDto = {
      ficha,
      filas,
      comparacion: {
        rango: { desde: '2026-07-01', hasta: '2026-07-31' },
        filas: [{ clave: 's1', etiqueta: 'Sucursal Central', valor: 100000 }],
        variaciones: [
          {
            clave: 's1',
            etiqueta: 'Sucursal Central',
            actual: 200000,
            anterior: 100000,
            deltaAbsoluto: 100000,
            deltaPorcentual: 100, // +100%
          },
        ],
      },
      narrativa: null,
    };

    const buffer = await service.generarReporteExcel({
      reporte,
      nombreTienda: 'Tiendaria',
      usuarioGenerador: 'gerente@tiendaria.com',
    });

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet('Reporte');

    // Fila 5: 4 encabezados
    expect(sheet!.getCell('A5').value).toBe('Concepto');
    expect(sheet!.getCell('B5').value).toBe('Valor Actual');
    expect(sheet!.getCell('C5').value).toBe('Período Anterior');
    expect(sheet!.getCell('D5').value).toBe('Variación (%)');

    // Fila 6: Datos de variación
    const filaDatos = sheet!.getRow(6);
    expect(filaDatos.getCell(1).value).toBe('Sucursal Central');
    expect(filaDatos.getCell(2).value).toBe(2000);
    expect(filaDatos.getCell(3).value).toBe(1000); // 100000 / 100
    expect(filaDatos.getCell(4).value).toBe(1);    // 100% -> 1.0
    expect(filaDatos.getCell(4).numFmt).toBe('+0.0%;-0.0%;0.0%');
    expect(filaDatos.getCell(4).font?.color?.argb).toBe('FF059669'); // Verde positivo

    // Fila 7: Fila de Totales con fórmula de variación entre sumatorias
    const filaTotales = sheet!.getRow(7);
    expect(filaTotales.getCell(2).value).toEqual({ formula: 'SUM(B6:B6)' });
    expect(filaTotales.getCell(3).value).toEqual({ formula: 'SUM(C6:C6)' });
    expect(filaTotales.getCell(4).value).toEqual({ formula: 'IF(C7=0, 0, (B7-C7)/C7)' });
  });

  it('formatea métricas de conteo/unidades sin división entre 100 ni máscara de moneda', async () => {
    const ficha: FichaConsultaDto = {
      metrica: 'unidades',
      agruparPor: 'categoria',
      filtros: {},
      orden: 'desc',
      limite: 10,
    };
    const filas: FilaReporte[] = [
      { clave: 'c1', etiqueta: 'Vestidos', valor: 45 },
      { clave: 'c2', etiqueta: 'Blusas', valor: 30 },
    ];
    const reporte: ReporteResponseDto = { ficha, filas, comparacion: null, narrativa: null };

    const buffer = await service.generarReporteExcel({ reporte, nombreTienda: 'Tiendaria' });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet('Reporte');

    const fila1 = sheet!.getRow(6);
    expect(fila1.getCell(2).value).toBe(45);
    expect(fila1.getCell(2).numFmt).toBe('#,##0');
  });

  it('maneja reportes sin filas agregando un mensaje descriptivo', async () => {
    const ficha: FichaConsultaDto = {
      metrica: 'ingresos',
      agruparPor: 'sucursal',
      filtros: {},
      orden: 'desc',
      limite: 10,
    };
    const reporte: ReporteResponseDto = { ficha, filas: [], comparacion: null, narrativa: null };

    const buffer = await service.generarReporteExcel({ reporte });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet('Reporte');

    expect(sheet!.getCell('A6').value).toContain('No se encontraron datos');
  });

  it('generarLibro ejecuta la consulta en motorConsulta si no vienen filas', async () => {
    const dto: ExportarReporteDto = {
      ficha: {
        metrica: 'ingresos',
        agruparPor: 'sucursal',
        filtros: {},
        orden: 'desc',
        limite: 20,
      },
    };

    const buffer = await service.generarLibro(dto, 'admin@tiendaria.com');
    expect(motorConsulta.ejecutar).toHaveBeenCalledWith(dto.ficha);
    expect(buffer.length).toBeGreaterThan(500);
  });

  it('generarLibro fuerza el alcance de sucursal para ENCARGADO_SUCURSAL', async () => {
    const dto: ExportarReporteDto = {
      ficha: {
        metrica: 'ingresos',
        agruparPor: 'canal',
        filtros: {},
        orden: 'desc',
        limite: 20,
      },
    };
    const user: JwtPayload = {
      sub: 'usr-1',
      email: 'encargado@tiendaria.com',
      role: 'ENCARGADO_SUCURSAL',
      sucursalId: '00000000-0000-0000-0000-000000000099',
      tenantId: '00000000-0000-0000-0000-000000000001',
    };

    await service.generarLibro(dto, user.email, user);
    expect(motorConsulta.ejecutar).toHaveBeenCalledWith(
      expect.objectContaining({
        filtros: expect.objectContaining({
          sucursalId: '00000000-0000-0000-0000-000000000099',
        }),
      }),
    );
  });

  it('generarLibro acepta un payload con reporte anidado', async () => {
    const dto: ExportarReporteDto = {
      reporte: {
        ficha: { metrica: 'cantidad_ventas', agruparPor: 'metodo_pago', filtros: {}, orden: 'desc', limite: 10 },
        filas: [{ clave: 'EFECTIVO', etiqueta: 'EFECTIVO', valor: 12 }],
        comparacion: null,
        narrativa: null,
      },
    };

    const buffer = await service.generarLibro(dto, 'admin@tiendaria.com');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(motorConsulta.ejecutar).not.toHaveBeenCalled();
  });
});
