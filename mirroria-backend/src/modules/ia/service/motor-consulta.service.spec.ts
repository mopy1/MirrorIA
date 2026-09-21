import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { MotorConsultaService } from './motor-consulta.service.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';

function ficha(p: Partial<FichaConsultaDto>): FichaConsultaDto {
  return plainToInstance(FichaConsultaDto, { filtros: {}, orden: 'desc', limite: 20, ...p });
}

describe('MotorConsultaService', () => {
  let query: ReturnType<typeof vi.fn>;
  let service: MotorConsultaService;

  beforeEach(() => {
    query = vi.fn().mockResolvedValue([{ clave: 'x', etiqueta: 'Santa Cruz', valor: '150000' }]);
    service = new MotorConsultaService({ query } as unknown as DataSource);
  });

  const sqlDeLaLlamada = () => String(query.mock.calls[0][0]);
  const paramsDeLaLlamada = () => query.mock.calls[0][1] as unknown[];

  it('suma total_cents agrupando por sucursal', async () => {
    await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'sucursal' }));
    expect(sqlDeLaLlamada()).toContain('COALESCE(SUM(v.total_cents), 0)');
    expect(sqlDeLaLlamada()).toContain('JOIN sucursales s ON s.id = v.sucursal_id');
    expect(sqlDeLaLlamada()).toContain('GROUP BY');
  });

  it('aplica estado PAGADA por defecto', async () => {
    await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno' }));
    expect(sqlDeLaLlamada()).toContain("v.estado = 'PAGADA'");
  });

  it('un estado explicito reemplaza al de por defecto, no se suma', async () => {
    await service.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { estado: 'CANCELADA' } }),
    );
    expect(sqlDeLaLlamada()).not.toContain("v.estado = 'PAGADA'");
    expect(paramsDeLaLlamada()).toContain('CANCELADA');
  });

  it('rechaza un estado que no existe en el dominio de la metrica', async () => {
    await expect(
      service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { estado: 'INVENTADO' } })),
    ).rejects.toThrow(CombinacionInvalidaException);
  });

  it('parametriza las fechas, nunca las interpola', async () => {
    await service.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'mes', filtros: { desde: '2026-08-01', hasta: '2026-08-31' } }),
    );
    // El catalogo (Task 1-3, fijo) declara columnaFecha como v."createdAt" (camelCase, entre
    // comillas dobles) — nunca v.created_at. Ver AGENTS.md / nota de comillas en createdAt.
    expect(sqlDeLaLlamada()).toContain('v."createdAt" >= $');
    expect(paramsDeLaLlamada()).toContain('2026-08-01');
  });

  it('rechaza agrupar stock por dia', async () => {
    await expect(
      service.ejecutar(ficha({ metrica: 'stock_disponible', agruparPor: 'dia' })),
    ).rejects.toThrow(CombinacionInvalidaException);
  });

  it('rechaza un filtro que la metrica no admite', async () => {
    await expect(
      service.ejecutar(ficha({ metrica: 'stock_disponible', agruparPor: 'ninguno', filtros: { canal: 'WEB' } })),
    ).rejects.toThrow(CombinacionInvalidaException);
  });

  it('devuelve el valor como numero, no como el string que da el driver pg', async () => {
    const filas = await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'sucursal' }));
    expect(filas[0].valor).toBe(150000);
    expect(typeof filas[0].valor).toBe('number');
  });

  it('no duplica un join que ya esta en joinsBase', async () => {
    await service.ejecutar(ficha({ metrica: 'unidades', agruparPor: 'producto' }));
    const ocurrencias = sqlDeLaLlamada().split('JOIN venta_items vi').length - 1;
    expect(ocurrencias).toBe(1);
  });
});
