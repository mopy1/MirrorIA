import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DuckDbService } from './duckdb.service.js';

describe('DuckDbService', () => {
  let service: DuckDbService;

  beforeAll(async () => {
    service = new DuckDbService();
    await service.onModuleInit();
  });

  afterAll(() => {
    service.onModuleDestroy();
  });

  it('devuelve array vacio si no hay datos base', async () => {
    const res = await service.proyectarWhatIf([], 10);
    expect(res).toEqual([]);
  });

  it('proyecta variacion de precio y volumen correctamente', async () => {
    const datos = [
      { etiqueta: 'Sucursal Central', valor: 1000 },
      { etiqueta: 'Sucursal Norte', valor: 500 },
    ];
    // -10% precio, +20% volumen => 0.9 * 1.2 = 1.08 (+8%)
    const res = await service.proyectarWhatIf(datos, -10, 20);

    expect(res).toHaveLength(2);
    expect(res[0].valorOriginal).toBe(1000);
    expect(res[0].valorProyectado).toBe(1080);
    expect(res[0].deltaAbsoluto).toBe(80);
    expect(res[0].deltaPorcentual).toBe(8);

    expect(res[1].valorOriginal).toBe(500);
    expect(res[1].valorProyectado).toBe(540);
    expect(res[1].deltaAbsoluto).toBe(40);
  });

  it('soporta etiquetas con comillas simples sin inyeccion SQL', async () => {
    const datos = [{ etiqueta: "Tienda d'Oro & L'Atelier", valor: 200 }];
    const res = await service.proyectarWhatIf(datos, 10, 0);

    expect(res).toHaveLength(1);
    expect(res[0].etiqueta).toBe("Tienda d'Oro & L'Atelier");
    expect(res[0].valorProyectado).toBe(220);
    expect(res[0].deltaPorcentual).toBe(10);
  });
});
