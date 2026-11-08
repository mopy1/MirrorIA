import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prepararBase, type BaseLocal } from './baseLocal';
import { agregarAlCarrito, listarCarrito, quitarDelCarrito, reemplazarCarrito } from './carritoLocal';
import { conCatalogoLocal, VIGENCIA_MS } from './catalogoLocal';
import { encolar, pendientes, sincronizar, type RespuestaEnvio } from './outboxLocal';

/** SQLite de verdad: el mismo SQL que corre en el teléfono. */
function baseEnMemoria(): BaseLocal {
  const sqlite = new DatabaseSync(':memory:');
  return {
    ejecutar: async (sql, params = []) => { sqlite.prepare(sql).run(...params); },
    consultar: async <T,>(sql: string, params: (string | number | null)[] = []) => sqlite.prepare(sql).all(...params) as T[],
  };
}

const ANA = { tienda: 'luna', usuarioId: 'u1' };
const op = (id: string, n: number, items = [{ varianteId: 'v1', cantidad: 1 }]) =>
  [{ id, clave: `k-${id}`, tipo: 'COMPRA', endpoint: '/ventas/carrito/u1/checkout', payload: { items } }, n] as const;
const sinRed = Object.assign(new Error('red'), { status: 0 });

describe('offline en SQLite', () => {
  let db: BaseLocal;
  beforeEach(async () => {
    db = baseEnMemoria();
    await prepararBase(db);
  });

  it('preparar la base dos veces no rompe nada', async () => {
    await expect(prepararBase(db)).resolves.toBeUndefined();
  });

  describe('catálogo', () => {
    it('sin red entrega lo guardado', async () => {
      await conCatalogoLocal(db, 'luna', 'productos', async () => ['a']);
      await expect(conCatalogoLocal(db, 'luna', 'productos', async () => { throw sinRed; })).resolves.toEqual(['a']);
    });

    it('no mezcla tiendas', async () => {
      await conCatalogoLocal(db, 'luna', 'productos', async () => ['a']);
      await expect(conCatalogoLocal(db, 'sol', 'productos', async () => { throw sinRed; })).rejects.toBe(sinRed);
    });

    it('lo guardado hace más de 7 días ya no sirve', async () => {
      await conCatalogoLocal(db, 'luna', 'productos', async () => ['a'], 0);
      await expect(conCatalogoLocal(db, 'luna', 'productos', async () => { throw sinRed; }, VIGENCIA_MS + 1)).rejects.toBe(sinRed);
    });

    it('un error del servidor no se disimula con datos viejos', async () => {
      await conCatalogoLocal(db, 'luna', 'productos', async () => ['a']);
      const error = Object.assign(new Error('x'), { status: 500 });
      await expect(conCatalogoLocal(db, 'luna', 'productos', async () => { throw error; })).rejects.toBe(error);
    });
  });

  describe('carrito local', () => {
    it('suma, quita y separa por persona', async () => {
      await agregarAlCarrito(db, ANA, { varianteId: 'v1', cantidad: 1 });
      await agregarAlCarrito(db, ANA, { varianteId: 'v1', cantidad: 2 });
      await agregarAlCarrito(db, { tienda: 'luna', usuarioId: 'u2' }, { varianteId: 'v9', cantidad: 1 });
      expect(await listarCarrito(db, ANA)).toEqual([{ varianteId: 'v1', cantidad: 3 }]);
      expect(await quitarDelCarrito(db, ANA, 'v1')).toEqual([]);
    });

    it('la foto del servidor reemplaza lo local', async () => {
      await agregarAlCarrito(db, ANA, { varianteId: 'viejo', cantidad: 1 });
      await reemplazarCarrito(db, ANA, [{ varianteId: 'v2', cantidad: 2 }]);
      expect(await listarCarrito(db, ANA)).toEqual([{ varianteId: 'v2', cantidad: 2 }]);
    });
  });

  describe('sincronización', () => {
    const responde = (...r: RespuestaEnvio[]) => {
      const fn = vi.fn();
      r.forEach((x) => fn.mockResolvedValueOnce(x));
      return fn;
    };

    it('envía en orden y con la clave guardada', async () => {
      await encolar(db, ANA, ...op('b', 2));
      await encolar(db, ANA, ...op('a', 1));
      const enviar = responde({ status: 201, body: {} }, { status: 201, body: {} });
      await sincronizar(db, { ...ANA, enviar });
      expect(enviar.mock.calls.map(([o]) => o.clave)).toEqual(['k-a', 'k-b']);
      expect(await pendientes(db, ANA)).toEqual([]);
    });

    it('la misma clave no se puede encolar dos veces', async () => {
      await encolar(db, ANA, ...op('a', 1));
      await expect(encolar(db, ANA, { ...op('a', 1)[0], id: 'otra' })).rejects.toThrow();
    });

    it('sin red corta, conserva todo y reintenta con la misma clave', async () => {
      await encolar(db, ANA, ...op('a', 1));
      await encolar(db, ANA, ...op('b', 2));
      const caida = vi.fn().mockRejectedValue(new Error('red'));
      await sincronizar(db, { ...ANA, enviar: caida });
      expect(caida).toHaveBeenCalledTimes(1);
      expect((await pendientes(db, ANA)).map((o) => o.clave)).toEqual(['k-a', 'k-b']);
    });

    it('un cierre de la app a mitad de envío se retoma', async () => {
      await encolar(db, ANA, ...op('a', 1));
      await db.ejecutar(`UPDATE outbox SET estado = 'SINCRONIZANDO'`);
      const enviar = responde({ status: 201, body: {} });
      await sincronizar(db, { ...ANA, enviar });
      expect(enviar).toHaveBeenCalledTimes(1);
    });

    it('conflicto de stock: revierte, devuelve las prendas al carrito y sigue', async () => {
      await encolar(db, ANA, ...op('a', 1, [{ varianteId: 'ultima', cantidad: 1 }]));
      await encolar(db, ANA, ...op('b', 2));
      const alConflicto = vi.fn();
      const r = await sincronizar(db, {
        ...ANA,
        alConflicto,
        enviar: responde({ status: 409, body: { codigo: 'STOCK_AGOTADO_CONFLICTO', detalles: { titulo: 'x' } } }, { status: 201, body: {} }),
      });
      expect(r).toEqual({ enviadas: 1, compensadas: 1, rechazadas: 0 });
      expect(alConflicto.mock.calls[0][1]).toEqual({ titulo: 'x' });
      expect(await listarCarrito(db, ANA)).toEqual([{ varianteId: 'ultima', cantidad: 1 }]);
    });

    it('un 500, un 401, una clave en curso y una tienda suspendida quedan pendientes', async () => {
      const casos: RespuestaEnvio[] = [
        { status: 500, body: {} },
        { status: 401, body: {} },
        { status: 409, body: { codigo: 'IDEMPOTENCIA_EN_CURSO' } },
        { status: 403, body: { codigo: 'TIENDA_NO_DISPONIBLE' } },
      ];
      for (const caso of casos) {
        const local = baseEnMemoria();
        await prepararBase(local);
        await encolar(local, ANA, ...op('a', 1));
        await sincronizar(local, { ...ANA, enviar: responde(caso) });
        expect(await pendientes(local, ANA)).toHaveLength(1);
      }
    });

    it('un rechazo de negocio no traba la cola: devuelve las prendas, avisa y sigue', async () => {
      await encolar(db, ANA, ...op('a', 1, [{ varianteId: 'v4', cantidad: 4 }]));
      await encolar(db, ANA, ...op('b', 2));
      const alRechazo = vi.fn();
      const r = await sincronizar(db, {
        ...ANA,
        alRechazo,
        enviar: responde({ status: 409, body: { message: 'Hasta 3 unidades' } }, { status: 201, body: {} }),
      });
      expect(r).toEqual({ enviadas: 1, compensadas: 0, rechazadas: 1 });
      expect(alRechazo.mock.calls[0][1]).toBe('Hasta 3 unidades');
      // Vuelven al carrito, pero sin pasar el tope de 3 unidades.
      expect(await listarCarrito(db, ANA)).toEqual([{ varianteId: 'v4', cantidad: 3 }]);
    });

    it('una prenda borrada (404) tampoco se pierde en silencio', async () => {
      await encolar(db, ANA, ...op('a', 1, [{ varianteId: 'borrada', cantidad: 1 }]));
      const alRechazo = vi.fn();
      await sincronizar(db, { ...ANA, alRechazo, enviar: responde({ status: 404, body: { message: 'No existe' } }) });
      expect(alRechazo).toHaveBeenCalled();
      expect(await listarCarrito(db, ANA)).toEqual([{ varianteId: 'borrada', cantidad: 1 }]);
    });

    it('una validación rechazada no se reintenta para siempre', async () => {
      await encolar(db, ANA, ...op('a', 1));
      await sincronizar(db, { ...ANA, enviar: responde({ status: 400, body: { message: 'mal' } }) });
      expect(await pendientes(db, ANA)).toEqual([]);
    });

    it('la cola de otra persona no se envía', async () => {
      await encolar(db, { tienda: 'luna', usuarioId: 'u2' }, ...op('a', 1));
      const enviar = vi.fn();
      await sincronizar(db, { ...ANA, enviar });
      expect(enviar).not.toHaveBeenCalled();
    });
  });
});
