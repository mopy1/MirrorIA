import { describe, expect, it, vi } from 'vitest';
import type { ExportadorExcelService } from './exportador-excel.service.js';
import { ExportadorPdfService } from './exportador-pdf.service.js';

const FICHA = { metrica: 'ingresos', agruparPor: 'sucursal', filtros: {}, orden: 'desc', limite: 20 };

function servicio(filas: unknown[], comparacion: unknown = null) {
  const excel = {
    prepararDatos: vi.fn().mockResolvedValue({
      ficha: FICHA, filas, comparacion, nombreTienda: 'Tienda Luna', usuarioGenerador: 'ana@luna.bo',
    }),
    resumirFiltros: vi.fn(() => 'Sin filtros adicionales'),
  };
  return { excel, service: new ExportadorPdfService(excel as unknown as ExportadorExcelService) };
}

const paginas = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length;

describe('ExportadorPdfService', () => {
  it('genera un PDF valido con los datos que prepara el exportador', async () => {
    const { service, excel } = servicio([{ clave: 'a', etiqueta: 'Central', valor: 250000 }]);

    const pdf = await service.generarDocumento({ ficha: FICHA } as never, 'ana@luna.bo');

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.toString('latin1').trimEnd().endsWith('%%EOF')).toBe(true);
    expect(excel.prepararDatos).toHaveBeenCalled();
  });

  it('un reporte largo pasa a varias paginas en vez de cortarse', async () => {
    const filas = Array.from({ length: 120 }, (_, i) => ({ clave: `c${i}`, etiqueta: `Prenda ${i}`, valor: i * 100 }));
    const pdf = await servicio(filas).service.generarDocumento({ ficha: FICHA } as never, 'x');
    expect(paginas(pdf)).toBeGreaterThan(2);
  });

  it('sin datos genera igual un documento', async () => {
    const pdf = await servicio([]).service.generarDocumento({ ficha: FICHA } as never, 'x');
    expect(paginas(pdf)).toBe(1);
  });

  it('acepta la comparacion con el periodo anterior', async () => {
    const pdf = await servicio(
      [{ clave: 'a', etiqueta: 'Central', valor: 200 }],
      { variaciones: [{ clave: 'a', anterior: 100, deltaPorcentual: 100 }] },
    ).service.generarDocumento({ ficha: FICHA } as never, 'x');
    expect(paginas(pdf)).toBe(1);
  });
});
