import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { IaController } from './ia.controller.js';
import type { IaService } from '../service/ia.service.js';
import type { ExportadorExcelService } from '../service/exportador-excel.service.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { ExportarReporteDto } from '../dto/exportar-reporte.dto.js';

describe('IaController', () => {
  let controller: IaController;
  let iaService: {
    preguntar: ReturnType<typeof vi.fn>;
    reporteHibrido: ReturnType<typeof vi.fn>;
    consultar: ReturnType<typeof vi.fn>;
    historial: ReturnType<typeof vi.fn>;
  };
  let exportadorExcelService: {
    generarLibro: ReturnType<typeof vi.fn>;
  };

  const user: JwtPayload = {
    sub: 'user-uuid',
    email: 'admin@tiendaria.com',
    role: 'ADMIN',
    tenantId: '00000000-0000-4000-a000-000000000001',
  };

  beforeEach(() => {
    iaService = {
      preguntar: vi.fn(),
      reporteHibrido: vi.fn(),
      consultar: vi.fn(),
      historial: vi.fn(),
    };
    exportadorExcelService = {
      generarLibro: vi.fn().mockResolvedValue(Buffer.from('MOCK_EXCEL_BYTES')),
    };

    controller = new IaController(
      iaService as unknown as IaService,
      exportadorExcelService as unknown as ExportadorExcelService,
      {} as never,
    );
  });

  describe('POST /ia/reportes/exportar-excel', () => {
    it('genera el buffer binario y configura las cabeceras HTTP correctas', async () => {
      const dto: ExportarReporteDto = {
        ficha: {
          metrica: 'ingresos',
          agruparPor: 'metodo_pago',
          filtros: {},
          orden: 'desc',
          limite: 20,
        },
      };

      const res = {
        setHeader: vi.fn(),
        end: vi.fn(),
      } as unknown as Response;

      await controller.exportarExcel(dto, user, res);

      expect(exportadorExcelService.generarLibro).toHaveBeenCalledWith(dto, user.email, user);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="reporte_ingresos_\d{4}-\d{2}-\d{2}\.xlsx"$/),
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Length', 16);
      expect(res.end).toHaveBeenCalledWith(Buffer.from('MOCK_EXCEL_BYTES'));
    });
  });

  describe('POST /ia/reportes/consulta', () => {
    it('ejecuta la ficha sin IA delegando al servicio', async () => {
      const ficha = {
        metrica: 'ingresos',
        agruparPor: 'sucursal',
        filtros: {},
        orden: 'desc',
        limite: 20,
      };
      await controller.consulta(ficha, user);
      expect(iaService.consultar).toHaveBeenCalledWith(expect.objectContaining(ficha), user);
    });
  });
});
