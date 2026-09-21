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

  it('hasta incluye el dia entero, no se corta en su medianoche', async () => {
    await service.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { hasta: '2026-08-31' } }),
    );
    // `v."createdAt" <= '2026-08-31'` compara contra la medianoche del 31 y borra
    // el ultimo dia entero del periodo. Ver el comentario del motor.
    expect(sqlDeLaLlamada()).toContain(`v."createdAt" < ($1::date + INTERVAL '1 day')`);
    expect(sqlDeLaLlamada()).not.toContain('v."createdAt" <= $');
    expect(paramsDeLaLlamada()).toContain('2026-08-31');
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

  describe('dinero agrupado por categoria o producto (el fan-out de venta_items)', () => {
    it('ingresos por categoria agrega sobre la LINEA, no sobre la cabecera', async () => {
      await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'categoria' }));
      const sql = sqlDeLaLlamada();
      // El join multiplica la venta por su cantidad de lineas: sumar v.total_cents
      // contaria la venta entera en cada categoria que toca.
      expect(sql).toContain('JOIN venta_items vi');
      expect(sql).toContain('COALESCE(SUM(vi.subtotal_cents), 0)');
      expect(sql).not.toContain('SUM(v.total_cents)');
    });

    it('ingresos SIN esa dimension sigue sumando el total de la cabecera', async () => {
      await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'sucursal' }));
      const sql = sqlDeLaLlamada();
      expect(sql).toContain('COALESCE(SUM(v.total_cents), 0)');
      expect(sql).not.toContain('JOIN venta_items vi');
    });

    it('descuentos y ticket_promedio ya no admiten categoria ni producto', async () => {
      for (const metrica of ['descuentos', 'ticket_promedio'] as const) {
        for (const agruparPor of ['categoria', 'producto'] as const) {
          await expect(service.ejecutar(ficha({ metrica, agruparPor }))).rejects.toThrow(
            CombinacionInvalidaException,
          );
        }
      }
      expect(query).not.toHaveBeenCalled();
    });

    it('cantidad_ventas por categoria es inmune: cuenta ventas DISTINTAS', async () => {
      await service.ejecutar(ficha({ metrica: 'cantidad_ventas', agruparPor: 'categoria' }));
      expect(sqlDeLaLlamada()).toContain('COUNT(DISTINCT v.id)');
    });
  });

  it('no duplica un join que ya esta en joinsBase', async () => {
    await service.ejecutar(ficha({ metrica: 'unidades', agruparPor: 'producto' }));
    const ocurrencias = sqlDeLaLlamada().split('JOIN venta_items vi').length - 1;
    expect(ocurrencias).toBe(1);
  });

  it('una metrica que no existe en el catalogo es 400, no un 500', async () => {
    // El DTO ya la rechazaria, pero el motor es la ultima frontera antes de la base
    // y no debe confiar en que alguien valido antes.
    await expect(
      service.ejecutar(ficha({ metrica: 'inventada' as never, agruparPor: 'ninguno' })),
    ).rejects.toThrow(CombinacionInvalidaException);
    expect(query).not.toHaveBeenCalled();
  });

  describe('nulos que la validacion deja pasar (Gemini los emite de rutina)', () => {
    it('un filtro en null se saltea: nunca genera "columna = NULL"', async () => {
      await service.ejecutar(
        ficha({
          metrica: 'ingresos', agruparPor: 'ninguno',
          filtros: { sucursalId: null, clienteId: null } as never,
        }),
      );
      // `v.sucursal_id = NULL` nunca es verdadero: el reporte devolvia 0 filas y
      // se leia como "no hubo nada", que es peor que un error.
      expect(sqlDeLaLlamada()).not.toContain('v.sucursal_id');
      expect(sqlDeLaLlamada()).not.toContain('v.cliente_id = $');
      expect(paramsDeLaLlamada()).not.toContain(null);
    });

    it('un estado en null NO desactiva el estado por defecto', async () => {
      await service.ejecutar(
        ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { estado: null } as never }),
      );
      expect(sqlDeLaLlamada()).toContain("v.estado = 'PAGADA'");
    });

    it('un limite en null cae al tope duro, no a LIMIT NULL (= sin limite)', async () => {
      await service.ejecutar(
        ficha({ metrica: 'ingresos', agruparPor: 'sucursal', limite: null as never }),
      );
      // En Postgres `LIMIT NULL` es SIN LIMITE: el tope de 100 de la ficha se evaporaba.
      expect(paramsDeLaLlamada().at(-1)).toBe(20);
      expect(paramsDeLaLlamada()).not.toContain(null);
    });

    it('un limite explicito sigue mandando', async () => {
      await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'sucursal', limite: 5 }));
      expect(paramsDeLaLlamada().at(-1)).toBe(5);
    });
  });

  describe('reservas y campoFecha', () => {
    it('por defecto filtra por la fecha de creacion de la reserva', async () => {
      await service.ejecutar(
        ficha({ metrica: 'cantidad_reservas', agruparPor: 'estado', filtros: { desde: '2026-08-01' } }),
      );
      expect(sqlDeLaLlamada()).toContain('r."createdAt" >= $');
    });

    it('campoFecha prevista filtra por fecha_hora_prevista', async () => {
      await service.ejecutar(
        ficha({
          metrica: 'cantidad_reservas', agruparPor: 'estado',
          campoFecha: 'prevista', filtros: { desde: '2026-08-01' },
        }),
      );
      expect(sqlDeLaLlamada()).toContain('r.fecha_hora_prevista >= $');
      expect(sqlDeLaLlamada()).not.toContain('r."createdAt" >= $');
    });

    it('campoFecha sobre una metrica que no es de reservas es invalido', async () => {
      await expect(
        service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno', campoFecha: 'prevista' })),
      ).rejects.toThrow(CombinacionInvalidaException);
    });

    it('NO_SHOW es estado valido de reserva pero no de venta', async () => {
      await service.ejecutar(
        ficha({ metrica: 'cantidad_reservas', agruparPor: 'ninguno', filtros: { estado: 'NO_SHOW' } }),
      );
      expect(paramsDeLaLlamada()).toContain('NO_SHOW');

      query.mockClear();
      await expect(
        service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { estado: 'NO_SHOW' } })),
      ).rejects.toThrow(CombinacionInvalidaException);
    });
  });

  describe('metricas de cupones', () => {
    it('cuenta canjes desde ventas, nunca desde cupones.usos_actuales', async () => {
      await service.ejecutar(ficha({ metrica: 'canjes_cupon', agruparPor: 'cupon' }));
      const sql = sqlDeLaLlamada();
      expect(sql).toContain('FROM ventas v');
      // usos_actuales es un acumulado sin fecha: usarlo daria el mismo numero
      // para cualquier rango que se pida. Ver spec 4-bis.1.
      expect(sql).not.toContain('usos_actuales');
    });

    it('solo mira ventas que efectivamente usaron cupon', async () => {
      await service.ejecutar(ficha({ metrica: 'canjes_cupon', agruparPor: 'cupon' }));
      expect(sqlDeLaLlamada()).toContain('JOIN cupones cu ON cu.id = v.cupon_id');
    });

    it('acepta filtro de fechas, que es el punto de contarlo desde ventas', async () => {
      await service.ejecutar(
        ficha({ metrica: 'canjes_cupon', agruparPor: 'cupon', filtros: { desde: '2026-08-01' } }),
      );
      expect(sqlDeLaLlamada()).toContain('v."createdAt" >= $');
    });
  });

  describe('metricas de compras', () => {
    it('unidades_pedidas expande el jsonb de items', async () => {
      await service.ejecutar(ficha({ metrica: 'unidades_pedidas', agruparPor: 'proveedor' }));
      const sql = sqlDeLaLlamada();
      expect(sql).toContain('jsonb_array_elements');
      expect(sql).toContain('cantidadPedida');
    });

    it('cantidad_ordenes NO expande el jsonb: contaria una orden por cada item', async () => {
      await service.ejecutar(ficha({ metrica: 'cantidad_ordenes', agruparPor: 'proveedor' }));
      expect(sqlDeLaLlamada()).not.toContain('jsonb_array_elements');
    });

    it('filtra por fecha_pedido', async () => {
      await service.ejecutar(
        ficha({ metrica: 'cantidad_ordenes', agruparPor: 'ninguno', filtros: { desde: '2026-08-01' } }),
      );
      expect(sqlDeLaLlamada()).toContain('oc.fecha_pedido >= $');
    });
  });

  describe('metricas de clientes', () => {
    it('cuenta clientes distintos, no ventas', async () => {
      await service.ejecutar(ficha({ metrica: 'clientes_activos', agruparPor: 'ninguno' }));
      expect(sqlDeLaLlamada()).toContain('COUNT(DISTINCT v.cliente_id)');
    });

    it('excluye las ventas sin cliente identificado', async () => {
      await service.ejecutar(ficha({ metrica: 'clientes_activos', agruparPor: 'sucursal' }));
      // Una venta presencial puede no identificar al cliente. Sin esto,
      // "mis mejores clientes" mostraria un grupo vacio enorme. Ver spec 4-bis.5.
      expect(sqlDeLaLlamada()).toContain('v.cliente_id IS NOT NULL');
    });

    it('agrupar ingresos por cliente etiqueta con el nombre del usuario', async () => {
      await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'cliente' }));
      expect(sqlDeLaLlamada()).toContain('JOIN usuarios u ON u.id = v.cliente_id');
      expect(sqlDeLaLlamada()).toContain('u.full_name');
    });
  });
});
