import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { FichaConsultaDto } from './../src/modules/ia/dto/ficha-consulta.dto.js';
import { MotorConsultaService } from './../src/modules/ia/service/motor-consulta.service.js';
import { CarritosService } from './../src/modules/ventas/service/carritos.service.js';
import { VentasService } from './../src/modules/ventas/service/ventas.service.js';
import { PagosService } from './../src/modules/pagos/service/pagos.service.js';
import { ExpiracionService } from './../src/modules/pagos/service/expiracion.service.js';
import { PASARELA } from './../src/modules/pagos/service/pasarela/pasarela.interface.js';
import {
  FIRMA_SIMULADA,
  PasarelaSimulada,
} from './../src/modules/pagos/service/pasarela/simulada.pasarela.js';
import type { JwtPayload } from './../src/core/security/jwt-payload.interface.js';

// uuid fijos: siembra determinista, mismo patron que motor-consulta.e2e-spec.ts.
const ID = {
  ciudad: '00000000-0000-4000-9000-000000000001',
  suc: '00000000-0000-4000-9000-000000000002',
  prov: '00000000-0000-4000-9000-000000000003',
  temp: '00000000-0000-4000-9000-000000000004',
  colec: '00000000-0000-4000-9000-000000000005',
  cat: '00000000-0000-4000-9000-000000000006',
  talla: '00000000-0000-4000-9000-000000000007',
  color: '00000000-0000-4000-9000-000000000008',
  prod: '00000000-0000-4000-9000-000000000009',
  var: '00000000-0000-4000-9000-00000000000a',
  cliente: '00000000-0000-4000-9000-00000000000b',
  cajero: '00000000-0000-4000-9000-00000000000c',
  cupon: '00000000-0000-4000-9000-00000000000d',
};

const USUARIO_CLIENTE: JwtPayload = {
  sub: ID.cliente,
  email: 'clienta-pagos@test.com',
  role: 'CUSTOMER',
  sucursalId: null,
};

const USUARIO_CAJERO: JwtPayload = {
  sub: ID.cajero,
  email: 'cajero-pagos@test.com',
  role: 'CAJERO',
  sucursalId: ID.suc,
};

// Fixture propia del webhook: distinta de ID de arriba para no pisar el
// producto/variante que usa el resto del archivo (los describe corren en
// secuencia, pero conviene que cada uno sea independiente de leer).
const WID = {
  ciudad: '00000000-0000-4000-9001-000000000001',
  suc: '00000000-0000-4000-9001-000000000002',
  prov: '00000000-0000-4000-9001-000000000003',
  temp: '00000000-0000-4000-9001-000000000004',
  colec: '00000000-0000-4000-9001-000000000005',
  cat: '00000000-0000-4000-9001-000000000006',
  talla: '00000000-0000-4000-9001-000000000007',
  color: '00000000-0000-4000-9001-000000000008',
  prod: '00000000-0000-4000-9001-000000000009',
  var: '00000000-0000-4000-9001-00000000000a',
  cliente: '00000000-0000-4000-9001-00000000000b',
};

const USUARIO_CLIENTE_WEBHOOK: JwtPayload = {
  sub: WID.cliente,
  email: 'clienta-webhook@test.com',
  role: 'CUSTOMER',
  sucursalId: null,
};

describe('Pagos contra Postgres real (el stock y el cupon, no dobles)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let carritos: CarritosService;
  let ventas: VentasService;
  let pagos: PagosService;
  let expiracion: ExpiracionService;

  const stockDe = async (varianteId: string): Promise<number> => {
    const r = await ds.query(
      `SELECT cantidad_disponible FROM inventario_sucursal WHERE variante_id = $1`,
      [varianteId],
    );
    return Number(r[0].cantidad_disponible);
  };

  const usosDelCupon = async (): Promise<number> => {
    const r = await ds.query(`SELECT usos_actuales FROM cupones WHERE id = $1`, [ID.cupon]);
    return Number(r[0].usos_actuales);
  };

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    ds = app.get(DataSource);
    carritos = app.get(CarritosService);
    ventas = app.get(VentasService);
    pagos = app.get(PagosService);
    expiracion = app.get(ExpiracionService);
    await limpiar(ds);
    await sembrar(ds);
  });

  afterAll(async () => {
    await limpiar(ds);
    await app.close();
  });

  it('una venta pendiente con cupon, al vencer, devuelve el stock Y el uso del cupon', async () => {
    // Estado inicial sembrado: 10 disponibles, cupon en 5 usos.
    // Se siembra el carrito como lo haria la clienta antes del checkout.
    await carritos.addItem(ID.cliente, { varianteId: ID.var, cantidad: 3 } as never);

    // Se crea una venta digital de 3 unidades con el cupon, como haria el checkout:
    const venta = await ventas.checkoutCarrito(ID.cliente, {
      sucursalId: ID.suc, canal: 'WEB', codigoCupon: 'PRUEBA10',
    } as never);

    // Tras el checkout: stock 10 - 3 = 7, y el cupon subio a 6.
    expect(await stockDe(ID.var)).toBe(7);
    expect(await usosDelCupon()).toBe(6);

    // Se fuerza el vencimiento retrocediendo la fecha del pago. QR/EFECTIVO
    // tienen un plazo de 1440 minutos (un dia), asi que 2 horas no alcanza:
    // hay que retroceder mas de un dia.
    await pagos.iniciarManual(venta.id, { metodo: 'QR' } as never, USUARIO_CLIENTE);
    await ds.query(
      `UPDATE pagos SET "createdAt" = "createdAt" - INTERVAL '2 days' WHERE venta_id = $1`,
      [venta.id],
    );
    // Ojo: "createdAt" va entre comillas dobles, es camelCase en la base.

    const canceladas = await expiracion.expirarVencidas();

    expect(canceladas).toBe(1);
    expect(await stockDe(ID.var)).toBe(10);   // volvio entero
    expect(await usosDelCupon()).toBe(5);     // volvio al valor original
    expect((await ventas.findOne(venta.id)).estado).toBe('CANCELADA');
  });

  it('el movimiento de la devolucion es AJUSTE, no DEVOLUCION', async () => {
    // Llamar DEVOLUCION a esto inflaria la metrica de devoluciones con ventas
    // que jamas ocurrieron.
    const movs = await ds.query(
      `SELECT tipo_movimiento, motivo FROM movimientos_inventario
        WHERE variante_id = $1 AND cantidad > 0 ORDER BY fecha DESC LIMIT 1`,
      [ID.var],
    );
    expect(movs[0].tipo_movimiento).toBe('AJUSTE');
    expect(movs[0].motivo).toContain('no pagada');
  });

  it('una venta dentro del plazo NO se toca', async () => {
    await carritos.addItem(ID.cliente, { varianteId: ID.var, cantidad: 2 } as never);
    const venta = await ventas.checkoutCarrito(ID.cliente, {
      sucursalId: ID.suc, canal: 'WEB',
    } as never);
    await pagos.iniciarManual(venta.id, { metodo: 'EFECTIVO' } as never, USUARIO_CLIENTE);
    expect(await expiracion.expirarVencidas()).toBe(0);
    expect((await ventas.findOne(venta.id)).estado).toBe('PENDIENTE');
  });

  it('dos cancelaciones SIMULTANEAS devuelven el stock una sola vez', async () => {
    // El defecto: `cancelarPorPagoNoCompletado` leia la venta sin bloqueo,
    // verificaba que estuviera PENDIENTE, devolvia el stock, y recien al final
    // escribia CANCELADA. Dos peticiones concurrentes leian las dos PENDIENTE
    // y las dos sumaban el stock: el inventario ganaba unidades que no
    // existen, registradas como ajustes legitimos. Y pasa de verdad: como no
    // hay planificador, la barrida corre al inicio de tres endpoints de uso
    // normal, asi que alcanza con dos clientas operando a la vez con una venta
    // vencida en el medio.
    await carritos.addItem(ID.cliente, { varianteId: ID.var, cantidad: 4 } as never);
    const venta = await ventas.checkoutCarrito(ID.cliente, {
      sucursalId: ID.suc, canal: 'WEB',
    } as never);
    const stockConLaVentaViva = await stockDe(ID.var);

    const resultados = await Promise.allSettled([
      ventas.cancelarPorPagoNoCompletado(venta.id, 'barrida simultanea A'),
      ventas.cancelarPorPagoNoCompletado(venta.id, 'barrida simultanea B'),
    ]);

    // Una gana; la otra espera el bloqueo, encuentra la venta ya CANCELADA y
    // se niega a devolver el stock por segunda vez.
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.filter((r) => r.status === 'rejected')).toHaveLength(1);

    // Lo que importa: +4, no +8.
    expect(await stockDe(ID.var)).toBe(stockConLaVentaViva + 4);
    expect((await ventas.findOne(venta.id)).estado).toBe('CANCELADA');

    // Y tampoco quedo un segundo ajuste "legitimo" en el historial.
    const ajustes = await ds.query(
      `SELECT count(*) FROM movimientos_inventario
        WHERE variante_id = $1 AND motivo LIKE '%barrida simultanea%'`,
      [ID.var],
    );
    expect(Number(ajustes[0].count)).toBe(1);
  });

  it('confirmar un cobro manual deja la venta PAGADA y NO devuelve el stock', async () => {
    await carritos.addItem(ID.cliente, { varianteId: ID.var, cantidad: 2 } as never);
    const venta = await ventas.checkoutCarrito(ID.cliente, {
      sucursalId: ID.suc, canal: 'WEB',
    } as never);
    const stockTrasCheckout = await stockDe(ID.var);
    const instr = await pagos.iniciarManual(venta.id, { metodo: 'QR' } as never, USUARIO_CLIENTE);
    await pagos.confirmarManual(instr.pagoId, USUARIO_CAJERO);

    expect((await ventas.findOne(venta.id)).estado).toBe('PAGADA');
    expect(await stockDe(ID.var)).toBe(stockTrasCheckout); // la mercaderia se vendio
  });

  it('una venta digital cobrada suma exactamente su total al reporte de ingresos', async () => {
    // Antes de este modulo, ninguna venta digital llegaba a PAGADA y el reporte
    // solo veia el canal presencial. Se mide el delta y se acota por sucursal:
    // sin las dos cosas, la asercion pasaria por las ventas que siembra otro
    // archivo de pruebas en la misma base, aunque el cobro estuviera roto.
    const motor = app.get(MotorConsultaService);
    const ingresosWeb = async (): Promise<number> => {
      const filas = await motor.ejecutar(
        plainToInstance(FichaConsultaDto, {
          metrica: 'ingresos', agruparPor: 'canal',
          filtros: { sucursalId: ID.suc },
          orden: 'desc', limite: 10,
        }),
      );
      return filas.find((f) => f.etiqueta === 'WEB')?.valor ?? 0;
    };

    const antes = await ingresosWeb();

    // Una compra nueva, cobrada por la via manual.
    await carritos.addItem(ID.cliente, { varianteId: ID.var, cantidad: 1 } as never);
    const venta = await ventas.checkoutCarrito(ID.cliente, {
      sucursalId: ID.suc, canal: 'WEB',
    } as never);
    const instr = await pagos.iniciarManual(venta.id, { metodo: 'QR' } as never, USUARIO_CLIENTE);
    await pagos.confirmarManual(instr.pagoId, USUARIO_CAJERO);

    expect(await ingresosWeb()).toBe(antes + venta.totalCents);
  });
});

describe('Webhook de pagos: firma e idempotencia (pasarela simulada)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let carritos: CarritosService;
  let ventas: VentasService;
  let pagos: PagosService;
  let ventaId: string;
  let sesionId: string;

  beforeAll(async () => {
    // Se sustituye la pasarela real (Stripe) por la simulada: es para lo que
    // existe. Solo acepta FIRMA_SIMULADA y rechaza cualquier otra a proposito,
    // para que el camino feliz no pase con cualquier entrada.
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PASARELA)
      .useClass(PasarelaSimulada)
      .compile();
    app = mod.createNestApplication({ rawBody: true });
    // El prefijo lo pone bootstrap() en main.ts, no AppModule. Como el webhook
    // se golpea por HTTP real (no llamando al servicio), hay que replicarlo
    // a mano, igual que app.e2e-spec.ts.
    app.setGlobalPrefix('api/v1');
    await app.init();
    ds = app.get(DataSource);
    carritos = app.get(CarritosService);
    ventas = app.get(VentasService);
    pagos = app.get(PagosService);
    await limpiarWebhook(ds);
    await sembrarWebhook(ds);
  });

  afterAll(async () => {
    await limpiarWebhook(ds);
    await app.close();
  });

  // Una venta PENDIENTE con su sesion de tarjeta nueva antes de cada prueba: la
  // del webhook anterior puede haber quedado PAGADA o CANCELADA.
  beforeEach(async () => {
    await carritos.addItem(WID.cliente, { varianteId: WID.var, cantidad: 1 } as never);
    const venta = await ventas.checkoutCarrito(WID.cliente, {
      sucursalId: WID.suc, canal: 'WEB',
    } as never);
    ventaId = venta.id;
    await pagos.iniciarTarjeta(ventaId, USUARIO_CLIENTE_WEBHOOK);
    const fila = await ds.query(
      `SELECT referencia_externa FROM pagos WHERE venta_id = $1 AND proveedor_pago = 'STRIPE'`,
      [ventaId],
    );
    sesionId = fila[0].referencia_externa as string;
  });

  it('un webhook con firma invalida es 400 y la venta sigue PENDIENTE', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/pagos/webhook')
      .set('stripe-signature', 'firma-que-no-es')
      .send({ id: 'evt_x', sesionId: 'ses_x' })
      .expect(400);
    expect((await ventas.findOne(ventaId)).estado).toBe('PENDIENTE');
  });

  it('el mismo aviso dos veces: el segundo NO vuelve a procesar', async () => {
    const cuerpo = { id: 'evt_1', sesionId };

    const primera = await request(app.getHttpServer())
      .post('/api/v1/pagos/webhook')
      .set('stripe-signature', FIRMA_SIMULADA)
      .send(cuerpo)
      .expect(200);

    const segunda = await request(app.getHttpServer())
      .post('/api/v1/pagos/webhook')
      .set('stripe-signature', FIRMA_SIMULADA)
      .send(cuerpo)
      .expect(200);

    // Es la respuesta — no el conteo de filas — lo que distingue que la guarda
    // de idempotencia actuo: procesarEvento nunca INSERTA una fila en pagos,
    // siempre actualiza la que creo iniciarTarjeta, asi que count(*) da 1 pase
    // lo que pase, incluso si se borra la guarda (`pago.estado !== PENDIENTE`).
    // Sin la guarda el segundo aviso volveria a entrar a la transaccion y
    // devolveria procesado: true otra vez.
    expect(primera.body.procesado).toBe(true);
    expect(segunda.body.procesado).toBe(false);

    expect((await ventas.findOne(ventaId)).estado).toBe('PAGADA');
    // Asercion adicional, no la que prueba la idempotencia (ver comentario de
    // arriba): documenta que tampoco queda una fila extra en pagos.
    const filasPago = await ds.query(`SELECT count(*) FROM pagos WHERE venta_id = $1`, [ventaId]);
    expect(Number(filasPago[0].count)).toBe(1);
  });

  it('el webhook no puede cobrar una venta ya cancelada', async () => {
    // Su stock ya volvio al inventario: cobrarla dejaria vendida mercaderia que
    // el sistema cree tener. procesarEvento no debe propagar el error: la
    // pasarela recibe 200 (si no, reintentaria para siempre) y el pago queda
    // guardado marcado para reembolso en vez de perderse.
    await ventas.cancelarPorPagoNoCompletado(ventaId, 'prueba');
    await request(app.getHttpServer())
      .post('/api/v1/pagos/webhook')
      .set('stripe-signature', FIRMA_SIMULADA)
      .send({ id: 'evt_2', sesionId: sesionId })
      .expect(200);
    expect((await ventas.findOne(ventaId)).estado).toBe('CANCELADA');
  });
});

describe('GET /ventas/:id — una clienta puede ver su propia compra', () => {
  let app: INestApplication<App>;
  let ds: DataSource;

  const VID = {
    suc: '00000000-0000-4000-9002-000000000002',
    venta: '00000000-0000-4000-9002-000000000010',
  };

  let clienteA: { id: string; email: string; token: string };
  let clienteB: { id: string; email: string; token: string };
  let admin: { id: string; email: string; token: string };

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    // El prefijo lo pone bootstrap() en main.ts, no AppModule — igual que en
    // el describe del webhook, arriba: se pega por HTTP real.
    app.setGlobalPrefix('api/v1');
    await app.init();
    ds = app.get(DataSource);

    clienteA = await registrarCliente(app, ds);
    clienteB = await registrarCliente(app, ds);
    admin = await usuarioConRolGenerico(app, ds, 'ADMIN');

    // Insert directo: ventas.cliente_id/sucursal_id no tienen FK real (ver
    // \d ventas), asi que no hace falta sembrar producto/sucursal para esta
    // prueba de autorizacion — solo que cliente_id sea un usuario real (para
    // que el JWT de clienteA valide contra la tabla usuarios).
    await ds.query(
      `INSERT INTO ventas
         (id, cliente_id, sucursal_id, canal, estado, subtotal_cents, descuento_cents, total_cents)
       VALUES ($1, $2, $3, 'WEB', 'PAGADA', 1000, 0, 1000)`,
      [VID.venta, clienteA.id, VID.suc],
    );
  });

  afterAll(async () => {
    await ds.query(`DELETE FROM ventas WHERE id = $1`, [VID.venta]);
    await ds.query(`DELETE FROM usuarios WHERE id = ANY($1::uuid[])`, [
      [clienteA.id, clienteB.id, admin.id],
    ]);
    await app.close();
  });

  it('la clienta dueña de la venta puede leerla', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/ventas/${VID.venta}`)
      .set('Authorization', `Bearer ${clienteA.token}`)
      .expect(200);
    expect(res.body.id).toBe(VID.venta);
  });

  // La que importa: sin este chequeo, agregar CUSTOMER a los roles del
  // endpoint abriria el acceso de cualquier clienta a cualquier venta.
  it('otra clienta NO puede leer una venta ajena', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/ventas/${VID.venta}`)
      .set('Authorization', `Bearer ${clienteB.token}`)
      .expect(403);
  });

  it('un ADMIN puede leer cualquier venta', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/ventas/${VID.venta}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
  });
});

/**
 * Borra solo las filas de esta prueba y en orden de dependencia (hijos antes que
 * padres). `inventario_sucursal`, `movimientos_inventario` y `pagos` tienen id
 * generado, no uno de los fijos, asi que se borran por su FK (variante_id /
 * venta_id) — igual que en motor-consulta.e2e-spec.ts. Nada de `.catch()` que
 * trague errores: si la limpieza falla, la prueba debe romper y decirlo.
 */
async function limpiar(ds: DataSource): Promise<void> {
  const ids = Object.values(ID);
  const variantes = [ID.var];

  await ds.query(`DELETE FROM pagos WHERE venta_id IN (SELECT id FROM ventas WHERE sucursal_id = $1)`, [ID.suc]);
  await ds.query(`DELETE FROM venta_items WHERE venta_id IN (SELECT id FROM ventas WHERE sucursal_id = $1)`, [ID.suc]);
  await ds.query(`DELETE FROM ventas WHERE sucursal_id = $1`, [ID.suc]);
  await ds.query(`DELETE FROM movimientos_inventario WHERE variante_id = ANY($1::uuid[])`, [variantes]);
  await ds.query(`DELETE FROM inventario_sucursal WHERE variante_id = ANY($1::uuid[])`, [variantes]);
  await ds.query(`DELETE FROM carritos WHERE usuario_id = $1`, [ID.cliente]);
  await ds.query(`DELETE FROM variantes_producto WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM productos WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM colecciones WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM temporadas WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM categorias WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM tallas WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM colores WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM cupones WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM sucursales WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM ciudades WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM proveedores WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM usuarios WHERE id = ANY($1::uuid[])`, [ids]);
}

async function sembrar(ds: DataSource): Promise<void> {
  const q = (sql: string, p: unknown[] = []) => ds.query(sql, p);

  await q(`INSERT INTO ciudades (id, nombre, pais) VALUES ($1, 'Santa Cruz', 'Bolivia')`, [ID.ciudad]);
  await q(`INSERT INTO sucursales (id, nombre, direccion, ciudad_id, activo)
           VALUES ($1, 'Sucursal Pagos', 'Av 1', $2, true)`, [ID.suc, ID.ciudad]);
  await q(`INSERT INTO proveedores (id, razon_social, activo) VALUES ($1, 'Textiles SA', true)`, [ID.prov]);
  await q(`INSERT INTO temporadas (id, nombre, fecha_inicio, fecha_fin)
           VALUES ($1, 'Verano 2026', '2026-01-01', '2026-12-31')`, [ID.temp]);
  await q(`INSERT INTO colecciones (id, nombre, temporada_id, proveedor_id)
           VALUES ($1, 'Coleccion Pagos', $2, $3)`, [ID.colec, ID.temp, ID.prov]);
  await q(`INSERT INTO categorias (id, nombre, slug, activo)
           VALUES ($1, 'Pagos Cat', 'pagos-cat', true)`, [ID.cat]);
  // Nombres distintos a los de motor-consulta.e2e-spec.ts: tallas.nombre y
  // colores.nombre son UNIQUE globales, y vitest corre los archivos .e2e-spec
  // en paralelo — con 'M'/'Negro' los dos INSERT chocan entre si.
  await q(`INSERT INTO tallas (id, nombre, orden) VALUES ($1, 'M-PAGOS', 2)`, [ID.talla]);
  await q(`INSERT INTO colores (id, nombre, hex_code) VALUES ($1, 'Negro Pagos', '#000000')`, [ID.color]);
  await q(`INSERT INTO productos (id, titulo, slug, precio_cents, categoria_id, coleccion_id, activo, imagenes)
           VALUES ($1, 'Vestido Pagos', 'vestido-pagos', 5000, $2, $3, true, '[]'::jsonb)`,
    [ID.prod, ID.cat, ID.colec]);
  await q(`INSERT INTO variantes_producto (id, sku, producto_id, talla_id, color_id, activo)
           VALUES ($1, 'SKU-PAGOS-1', $2, $3, $4, true)`, [ID.var, ID.prod, ID.talla, ID.color]);

  // Inventario: 10 unidades disponibles, nada reservado ni en transito.
  await q(`INSERT INTO inventario_sucursal
             (id, variante_id, sucursal_id, cantidad_disponible, cantidad_reservada, cantidad_en_transito)
           VALUES (gen_random_uuid(), $1, $2, 10, 0, 0)`, [ID.var, ID.suc]);

  await q(`INSERT INTO usuarios (id, email, password_hash, full_name, role, sucursal_id, is_active)
           VALUES ($1, 'clienta-pagos@test.com', 'x', 'Clienta Pagos', 'CUSTOMER', NULL, true),
                  ($2, 'cajero-pagos@test.com', 'x', 'Cajero Pagos', 'CAJERO', $3, true)`,
    [ID.cliente, ID.cajero, ID.suc]);

  // Cupon ya con 5 usos previos, vigente durante toda la corrida de pruebas.
  await q(`INSERT INTO cupones (id, codigo, tipo_descuento, valor, fecha_inicio, fecha_fin, usos_actuales, activo)
           VALUES ($1, 'PRUEBA10', 'PORCENTAJE', 10, '2020-01-01', '2030-12-31', 5, true)`, [ID.cupon]);
}

/**
 * Igual patron que `limpiar`/`sembrar` de arriba, pero con la fixture propia
 * del webhook (WID). Sin cupon: el webhook no lo necesita.
 */
async function limpiarWebhook(ds: DataSource): Promise<void> {
  const ids = Object.values(WID);
  const variantes = [WID.var];

  await ds.query(`DELETE FROM pagos WHERE venta_id IN (SELECT id FROM ventas WHERE sucursal_id = $1)`, [WID.suc]);
  await ds.query(`DELETE FROM venta_items WHERE venta_id IN (SELECT id FROM ventas WHERE sucursal_id = $1)`, [WID.suc]);
  await ds.query(`DELETE FROM ventas WHERE sucursal_id = $1`, [WID.suc]);
  await ds.query(`DELETE FROM movimientos_inventario WHERE variante_id = ANY($1::uuid[])`, [variantes]);
  await ds.query(`DELETE FROM inventario_sucursal WHERE variante_id = ANY($1::uuid[])`, [variantes]);
  await ds.query(`DELETE FROM carritos WHERE usuario_id = $1`, [WID.cliente]);
  await ds.query(`DELETE FROM variantes_producto WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM productos WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM colecciones WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM temporadas WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM categorias WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM tallas WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM colores WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM sucursales WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM ciudades WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM proveedores WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM usuarios WHERE id = ANY($1::uuid[])`, [ids]);
}

async function sembrarWebhook(ds: DataSource): Promise<void> {
  const q = (sql: string, p: unknown[] = []) => ds.query(sql, p);

  await q(`INSERT INTO ciudades (id, nombre, pais) VALUES ($1, 'Santa Cruz', 'Bolivia')`, [WID.ciudad]);
  await q(`INSERT INTO sucursales (id, nombre, direccion, ciudad_id, activo)
           VALUES ($1, 'Sucursal Webhook', 'Av 2', $2, true)`, [WID.suc, WID.ciudad]);
  await q(`INSERT INTO proveedores (id, razon_social, activo) VALUES ($1, 'Textiles Webhook SA', true)`, [WID.prov]);
  await q(`INSERT INTO temporadas (id, nombre, fecha_inicio, fecha_fin)
           VALUES ($1, 'Verano Webhook 2026', '2026-01-01', '2026-12-31')`, [WID.temp]);
  await q(`INSERT INTO colecciones (id, nombre, temporada_id, proveedor_id)
           VALUES ($1, 'Coleccion Webhook', $2, $3)`, [WID.colec, WID.temp, WID.prov]);
  await q(`INSERT INTO categorias (id, nombre, slug, activo)
           VALUES ($1, 'Webhook Cat', 'webhook-cat', true)`, [WID.cat]);
  // Nombres distintos a los de los otros .e2e-spec: tallas.nombre y
  // colores.nombre son UNIQUE globales y vitest corre los archivos en paralelo.
  await q(`INSERT INTO tallas (id, nombre, orden) VALUES ($1, 'M-WEBHOOK', 2)`, [WID.talla]);
  await q(`INSERT INTO colores (id, nombre, hex_code) VALUES ($1, 'Negro Webhook', '#000000')`, [WID.color]);
  await q(`INSERT INTO productos (id, titulo, slug, precio_cents, categoria_id, coleccion_id, activo, imagenes)
           VALUES ($1, 'Vestido Webhook', 'vestido-webhook', 5000, $2, $3, true, '[]'::jsonb)`,
    [WID.prod, WID.cat, WID.colec]);
  await q(`INSERT INTO variantes_producto (id, sku, producto_id, talla_id, color_id, activo)
           VALUES ($1, 'SKU-WEBHOOK-1', $2, $3, $4, true)`, [WID.var, WID.prod, WID.talla, WID.color]);

  // Inventario: 10 unidades disponibles, nada reservado ni en transito.
  await q(`INSERT INTO inventario_sucursal
             (id, variante_id, sucursal_id, cantidad_disponible, cantidad_reservada, cantidad_en_transito)
           VALUES (gen_random_uuid(), $1, $2, 10, 0, 0)`, [WID.var, WID.suc]);

  await q(`INSERT INTO usuarios (id, email, password_hash, full_name, role, sucursal_id, is_active)
           VALUES ($1, 'clienta-webhook@test.com', 'x', 'Clienta Webhook', 'CUSTOMER', NULL, true)`,
    [WID.cliente]);
}

/**
 * Registra un CUSTOMER real por HTTP (mismo patron que ia.e2e-spec.ts) y
 * devuelve tambien su id: hace falta para sembrar `ventas.cliente_id` y para
 * poder borrarlo despues. El registro publico siempre da CUSTOMER.
 */
async function registrarCliente(
  app: INestApplication<App>,
  ds: DataSource,
): Promise<{ id: string; email: string; token: string }> {
  const email = `ventas-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  const res = await request(app.getHttpServer())
    .post('/api/v1/seguridad/auth/register')
    .send({ email, password: 'Password123', fullName: 'Clienta Ventas E2E' })
    .expect(201);
  const filas = (await ds.query('SELECT id FROM usuarios WHERE email = $1', [email])) as Array<{
    id: string;
  }>;
  return { id: filas[0].id, email, token: (res.body as { accessToken: string }).accessToken };
}

/**
 * Registra un CUSTOMER, lo promueve al rol pedido por query directa y vuelve a
 * loguear (el rol viaja firmado dentro del JWT, no alcanza con cambiar la fila).
 */
async function usuarioConRolGenerico(
  app: INestApplication<App>,
  ds: DataSource,
  role: string,
): Promise<{ id: string; email: string; token: string }> {
  const { id, email } = await registrarCliente(app, ds);
  await ds.query('UPDATE usuarios SET role = $2 WHERE id = $1', [id, role]);
  const login = await request(app.getHttpServer())
    .post('/api/v1/seguridad/auth/login')
    .send({ email, password: 'Password123' })
    .expect(200);
  return { id, email, token: (login.body as { accessToken: string }).accessToken };
}
