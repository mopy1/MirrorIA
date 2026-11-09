import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import { prepararBase, type BaseLocal } from './baseLocal';
import {
  anotarEnviada, encolarVenta, marcarAtendida, sincronizarCaja, vendidoSinReflejar, ventasFallidasSinAtender,
  ventasPendientes, veredicto, type NuevaVenta, type RespuestaCaja, type VentaCaja,
} from './colaCaja';
import { fotoVencida, guardarStockCaja, leerStockCaja, VIGENCIA_STOCK_MS, type ItemCaja } from './stockCajaLocal';
import { armarPayload, avisoFallida, cobrar, disponibleLocal, VentaRechazada, type DependenciasCobro } from '../../features/mostrador/lib/venta-caja';

/** SQLite de verdad: el mismo SQL que corre en el teléfono. */
function telefono(): BaseLocal {
  const sqlite = new DatabaseSync(':memory:');
  return {
    ejecutar: async (sql, p = []) => { sqlite.prepare(sql).run(...p); },
    consultar: async <T,>(sql: string, p: (string | number | null)[] = []) => sqlite.prepare(sql).all(...p) as T[],
  };
}

const CARLA = { tienda: 'casa', usuarioId: 'cajera-1' };
const SUC = 'suc-1';
const item = (varianteId: string, disponible: number): ItemCaja => ({
  varianteId, productoId: 'p1', titulo: 'Blusa', talla: 'M', color: 'Rojo', sku: `SKU-${varianteId}`, precioCents: 10000, disponible,
});
const venta = (id: string, varianteId = 'v1', cantidad = 1): NuevaVenta => ({
  id, clave: `clave-${id}`, resumen: `${cantidad} × Blusa`, totalCents: 10000 * cantidad,
  payload: { sucursalId: SUC, vendidaEn: '2026-11-08T10:00:00.000Z', items: [{ varianteId, cantidad, precioUnitCents: 10000 }] },
});
const ok = (id = 'venta-srv'): RespuestaCaja => ({ status: 201, body: { id, numeroComprobante: 'C-1', totalCents: 10000 } });
const sinStock: RespuestaCaja = {
  status: 409,
  body: { codigo: 'STOCK_AGOTADO_CONFLICTO', message: 'Stock insuficiente', detalles: { disponible: 0, solicitado: 1 } },
};
const sinRed = () => Promise.reject(new TypeError('Network request failed'));

describe('caja sin internet (SQLite)', () => {
  let db: BaseLocal;
  beforeEach(async () => {
    db = telefono();
    await prepararBase(db);
  });

  it('preparar la base dos veces no rompe nada', async () => {
    await expect(prepararBase(db)).resolves.toBeUndefined();
  });

  describe('stock guardado', () => {
    it('guarda y lee la foto de la sucursal, sin mezclar tiendas ni sucursales', async () => {
      await guardarStockCaja(db, 'casa', SUC, [item('v1', 3), item('v2', 1)], 1000);
      expect((await leerStockCaja(db, 'casa', SUC))?.items.map((i) => i.disponible)).toEqual([3, 1]);
      expect(await leerStockCaja(db, 'otra', SUC)).toBeNull();
      expect(await leerStockCaja(db, 'casa', 'suc-2')).toBeNull();
    });

    it('una foto nueva reemplaza la anterior entera (lo que ya no está deja de venderse)', async () => {
      await guardarStockCaja(db, 'casa', SUC, [item('v1', 3), item('v2', 1)], 1000);
      await guardarStockCaja(db, 'casa', SUC, [item('v1', 2)], 2000);
      const foto = await leerStockCaja(db, 'casa', SUC);
      expect(foto).toMatchObject({ guardadoEn: 2000, items: [{ varianteId: 'v1', disponible: 2 }] });
    });

    it('una sucursal sin prendas también queda guardada (vacía, no "nunca abierta")', async () => {
      await guardarStockCaja(db, 'casa', SUC, [], 1000);
      expect(await leerStockCaja(db, 'casa', SUC)).toEqual({ guardadoEn: 1000, items: [] });
    });

    it('vence a los 7 días', async () => {
      await guardarStockCaja(db, 'casa', SUC, [item('v1', 3)], 0);
      const foto = (await leerStockCaja(db, 'casa', SUC))!;
      expect(fotoVencida(foto, VIGENCIA_STOCK_MS)).toBe(false);
      expect(fotoVencida(foto, VIGENCIA_STOCK_MS + 1)).toBe(true);
    });
  });

  describe('lo vendido descuenta del stock guardado', () => {
    it('lo pendiente descuenta; lo enviado solo si es posterior a la foto', async () => {
      await guardarStockCaja(db, 'casa', SUC, [item('v1', 3)], 1000);
      await anotarEnviada(db, CARLA, venta('a'), ok(), 500); // ya estaba en la foto
      await anotarEnviada(db, CARLA, venta('b'), ok(), 1500); // la foto no lo sabe
      await encolarVenta(db, CARLA, venta('c', 'v1', 2), 1600);
      const vendido = await vendidoSinReflejar(db, 'casa', SUC, 1000);
      expect(vendido).toEqual({ v1: 3 });
      expect(disponibleLocal(item('v1', 3), vendido)).toBe(0);
    });

    it('una venta FALLIDA devuelve la unidad al stock local', async () => {
      await guardarStockCaja(db, 'casa', SUC, [item('v1', 1)], 1000);
      await encolarVenta(db, CARLA, venta('a'), 1100);
      expect(await vendidoSinReflejar(db, 'casa', SUC, 1000)).toEqual({ v1: 1 });
      await sincronizarCaja(db, { ...CARLA, enviar: async () => sinStock });
      expect(await vendidoSinReflejar(db, 'casa', SUC, 1000)).toEqual({});
    });

    it('lo apartado por la reserva que se cobra se suma', () => {
      expect(disponibleLocal(item('v1', 0), {}, { v1: 1 })).toBe(1);
    });
  });

  describe('respuestas del servidor', () => {
    it('clasifica igual que la web', () => {
      expect(veredicto(201)).toBe('ENVIADA');
      expect(veredicto(409, 'STOCK_AGOTADO_CONFLICTO')).toBe('FALLIDA');
      expect(veredicto(409, 'IDEMPOTENCIA_EN_CURSO')).toBe('REINTENTAR');
      expect(veredicto(403, 'TIENDA_NO_DISPONIBLE')).toBe('REINTENTAR');
      expect(veredicto(403)).toBe('FALLIDA');
      expect(veredicto(400)).toBe('FALLIDA');
      expect(veredicto(422)).toBe('FALLIDA');
      for (const s of [0, 401, 408, 429, 500, 503]) expect(veredicto(s)).toBe('REINTENTAR');
    });
  });

  describe('sincronizar', () => {
    it('manda el cuerpo guardado tal cual con su clave, en orden', async () => {
      await encolarVenta(db, CARLA, venta('a'), 1);
      await encolarVenta(db, CARLA, venta('b', 'v2'), 2);
      const enviados: { clave: string; payload: string }[] = [];
      const r = await sincronizarCaja(db, {
        ...CARLA,
        enviar: async (v) => { enviados.push({ clave: v.clave, payload: v.payload }); return ok(); },
      });
      expect(r).toEqual({ enviadas: 2, fallidas: 0, pendientes: 0 });
      expect(enviados).toEqual([
        { clave: 'clave-a', payload: JSON.stringify(venta('a').payload) },
        { clave: 'clave-b', payload: JSON.stringify(venta('b', 'v2').payload) },
      ]);
    });

    it('sin red se corta y no pierde nada; la próxima vez reenvía con la misma clave', async () => {
      await encolarVenta(db, CARLA, venta('a'), 1);
      await encolarVenta(db, CARLA, venta('b'), 2);
      expect(await sincronizarCaja(db, { ...CARLA, enviar: sinRed })).toEqual({ enviadas: 0, fallidas: 0, pendientes: 2 });
      const [a] = await ventasPendientes(db, CARLA);
      expect(a).toMatchObject({ estado: 'PENDIENTE', reintentos: 1, clave: 'clave-a' });
      const claves: string[] = [];
      await sincronizarCaja(db, { ...CARLA, enviar: async (v) => { claves.push(v.clave); return ok(); } });
      expect(claves).toEqual(['clave-a', 'clave-b']);
    });

    it('una venta que quedó ENVIANDO (la app se cerró a mitad) se reenvía', async () => {
      await encolarVenta(db, CARLA, venta('a'), 1);
      await db.ejecutar(`UPDATE cola_caja SET estado = 'ENVIANDO'`);
      expect(await sincronizarCaja(db, { ...CARLA, enviar: async () => ok() })).toMatchObject({ enviadas: 1 });
    });

    it('una FALLIDA no traba la cola y deja un aviso que dice qué venta era', async () => {
      await encolarVenta(db, CARLA, venta('a'), Date.parse('2026-11-08T10:00:00Z'));
      await encolarVenta(db, CARLA, venta('b', 'v2'), 2);
      const avisadas: string[] = [];
      const r = await sincronizarCaja(db, {
        ...CARLA,
        enviar: async (v) => (v.id === 'a' ? sinStock : ok()),
        alFallar: (v) => avisadas.push(v.id),
      });
      expect(r).toEqual({ enviadas: 1, fallidas: 1, pendientes: 0 });
      expect(avisadas).toEqual(['a']);
      const [fallida] = await ventasFallidasSinAtender(db, CARLA);
      expect(fallida).toMatchObject({ id: 'a', estado: 'FALLIDA', codigo: 409 });
      const aviso = avisoFallida(fallida, (c) => `Bs ${c / 100}`);
      expect(aviso).toContain('Bs 100');
      expect(aviso).toContain('1 × Blusa');
      expect(aviso).toContain('devolvele el dinero');
      expect(aviso).toContain('No quedaba stock');
      // El aviso sigue hasta que lo marcan atendido.
      expect(await ventasFallidasSinAtender(db, CARLA)).toHaveLength(1);
      await marcarAtendida(db, 'a');
      expect(await ventasFallidasSinAtender(db, CARLA)).toHaveLength(0);
    });

    it('tienda suspendida (403 TIENDA_NO_DISPONIBLE): queda pendiente, no se pierde', async () => {
      await encolarVenta(db, CARLA, venta('a'), 1);
      const r = await sincronizarCaja(db, {
        ...CARLA,
        enviar: async () => ({ status: 403, body: { codigo: 'TIENDA_NO_DISPONIBLE', message: 'no disponible' } }),
      });
      expect(r).toEqual({ enviadas: 0, fallidas: 0, pendientes: 1 });
      expect(await ventasFallidasSinAtender(db, CARLA)).toHaveLength(0);
    });

    it('solo reenvía las de la cajera que cobró (la clave del servidor va con su usuario)', async () => {
      await encolarVenta(db, CARLA, venta('a'), 1);
      const otra = { tienda: 'casa', usuarioId: 'cajera-2' };
      expect(await sincronizarCaja(db, { ...otra, enviar: async () => ok() })).toEqual({ enviadas: 0, fallidas: 0, pendientes: 0 });
      expect(await ventasPendientes(db, CARLA)).toHaveLength(1);
    });

    it('borra lo enviado hace más de 8 días', async () => {
      await anotarEnviada(db, CARLA, venta('a'), ok(), 0);
      await sincronizarCaja(db, { ...CARLA, enviar: async () => ok(), ahora: () => 9 * 86_400_000 });
      expect(await db.consultar<VentaCaja>('SELECT * FROM cola_caja')).toHaveLength(0);
    });
  });

  describe('cobrar', () => {
    let n = 0;
    function deps(over: Partial<DependenciasCobro> = {}) {
      const llamadas = { enviados: [] as { cuerpo: string; clave: string }[], encoladas: [] as NuevaVenta[] };
      const d: DependenciasCobro = {
        enLinea: () => true,
        enviar: async (cuerpo, clave) => { llamadas.enviados.push({ cuerpo, clave }); return ok(); },
        encolar: async (v) => { llamadas.encoladas.push(v); await encolarVenta(db, CARLA, v); },
        anotarEnviada: (v, r) => anotarEnviada(db, CARLA, v, r),
        generarId: () => `id-${++n}`,
        ...over,
      };
      return { d, llamadas };
    }
    const nueva = () => {
      const payload = armarPayload(SUC, [{ item: item('v1', 2), cantidad: 1 }], null, new Date('2026-11-08T10:00:00Z'));
      return { payload, resumen: '1 × Blusa', totalCents: 10000 };
    };

    it('con red registra y anota la venta (para descontarla del stock guardado)', async () => {
      const { d } = deps();
      await expect(cobrar(nueva(), d)).resolves.toMatchObject({ estado: 'REGISTRADA', venta: { id: 'venta-srv' } });
      expect(await vendidoSinReflejar(db, 'casa', SUC, 0)).toEqual({ v1: 1 });
    });

    it('sin red va a la cola con fecha de cobro sin conexión', async () => {
      const { d, llamadas } = deps({ enLinea: () => false });
      await expect(cobrar(nueva(), d)).resolves.toMatchObject({ estado: 'EN_COLA', motivo: 'SIN_RED' });
      expect(llamadas.enviados).toHaveLength(0);
      const [p] = await ventasPendientes(db, CARLA);
      expect(p.vendida_sin_conexion_en).not.toBeNull();
    });

    it('si la respuesta se pierde, la cola manda EXACTAMENTE el mismo cuerpo y la misma clave', async () => {
      const { d, llamadas } = deps({
        enviar: async (cuerpo, clave) => { llamadas.enviados.push({ cuerpo, clave }); throw new TypeError('Network request failed'); },
      });
      await expect(cobrar(nueva(), d)).resolves.toMatchObject({ estado: 'EN_COLA', motivo: 'SIN_RESPUESTA' });
      const reenviados: { cuerpo: string; clave: string }[] = [];
      await sincronizarCaja(db, { ...CARLA, enviar: async (v) => { reenviados.push({ cuerpo: v.payload, clave: v.clave }); return ok(); } });
      expect(reenviados).toEqual(llamadas.enviados);
    });

    it('un 5xx o tienda suspendida también encola; un rechazo de negocio se avisa y NO encola', async () => {
      const caido = deps({ enviar: async () => ({ status: 503, body: {} }) });
      await expect(cobrar(nueva(), caido.d)).resolves.toMatchObject({ estado: 'EN_COLA' });
      const suspendida = deps({ enviar: async () => ({ status: 403, body: { codigo: 'TIENDA_NO_DISPONIBLE' } }) });
      await expect(cobrar(nueva(), suspendida.d)).resolves.toMatchObject({ estado: 'EN_COLA', motivo: 'TIENDA_NO_DISPONIBLE' });
      const agotado = deps({ enviar: async () => sinStock });
      await expect(cobrar(nueva(), agotado.d)).rejects.toBeInstanceOf(VentaRechazada);
      expect(agotado.llamadas.encoladas).toHaveLength(0);
    });

    it('el cuerpo lleva la clienta y la reserva cuando se cobra una reserva', () => {
      const p = armarPayload(SUC, [{ item: item('v1', 1), cantidad: 1 }], { clienteId: 'c1', reservaId: 'r1', codigo: 'R1' }, new Date(0));
      expect(p).toEqual({
        sucursalId: SUC, vendidaEn: '1970-01-01T00:00:00.000Z', clienteId: 'c1', reservaId: 'r1',
        items: [{ varianteId: 'v1', cantidad: 1, precioUnitCents: 10000 }],
      });
    });
  });

  it('dos cajas sin red venden la última unidad: una entra, la otra queda FALLIDA con aviso', async () => {
    // Servidor de juguete con stock = 1 e idempotencia por clave.
    let stock = 1;
    const porClave = new Map<string, RespuestaCaja>();
    const servidor = async (v: VentaCaja): Promise<RespuestaCaja> => {
      const previa = porClave.get(v.clave);
      if (previa) return previa;
      if (stock < 1) return sinStock;
      stock--;
      const r = ok(`srv-${v.id}`);
      porClave.set(v.clave, r);
      return r;
    };
    const cajaA = telefono();
    const cajaB = telefono();
    const ana = { tienda: 'casa', usuarioId: 'cajera-a' };
    const bea = { tienda: 'casa', usuarioId: 'cajera-b' };
    for (const [db2, c, id] of [[cajaA, ana, 'a'], [cajaB, bea, 'b']] as const) {
      await prepararBase(db2);
      await guardarStockCaja(db2, 'casa', SUC, [item('v1', 1)], 0);
      await encolarVenta(db2, c, venta(id), 10);
    }
    const ra = await sincronizarCaja(cajaA, { ...ana, enviar: servidor });
    const rb = await sincronizarCaja(cajaB, { ...bea, enviar: servidor });
    expect(ra).toEqual({ enviadas: 1, fallidas: 0, pendientes: 0 });
    expect(rb).toEqual({ enviadas: 0, fallidas: 1, pendientes: 0 });
    expect(stock).toBe(0);
    expect(await ventasFallidasSinAtender(cajaB, bea)).toHaveLength(1);
    // Reenviar la de A no duplica.
    const [enviada] = await cajaA.consultar<VentaCaja>('SELECT * FROM cola_caja');
    expect((await servidor(enviada)).body.id).toBe('srv-a');
  });
});
