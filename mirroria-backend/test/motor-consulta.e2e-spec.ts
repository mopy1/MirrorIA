import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { FichaConsultaDto } from './../src/modules/ia/dto/ficha-consulta.dto.js';
import { MotorConsultaService } from './../src/modules/ia/service/motor-consulta.service.js';
import { IaService } from './../src/modules/ia/service/ia.service.js';
import { CombinacionInvalidaException } from './../src/modules/ia/exception/combinacion-invalida.exception.js';

// uuid fijos: hacen la siembra determinista y las aserciones legibles.
const ID = {
  ciudad: '00000000-0000-4000-8000-000000000001',
  suc1: '00000000-0000-4000-8000-000000000002',   // "Sucursal Norte"
  suc2: '00000000-0000-4000-8000-000000000003',   // "Sucursal Sur"
  prov: '00000000-0000-4000-8000-000000000004',
  temp: '00000000-0000-4000-8000-000000000005',
  colec: '00000000-0000-4000-8000-000000000006',
  cat1: '00000000-0000-4000-8000-000000000007',   // "Vestidos"
  cat2: '00000000-0000-4000-8000-000000000008',   // "Blusas"
  talla: '00000000-0000-4000-8000-000000000009',
  color: '00000000-0000-4000-8000-00000000000a',
  prod1: '00000000-0000-4000-8000-00000000000b',  // categoria Vestidos
  prod2: '00000000-0000-4000-8000-00000000000c',  // categoria Blusas
  var1: '00000000-0000-4000-8000-00000000000d',
  var2: '00000000-0000-4000-8000-00000000000e',
  cliente1: '00000000-0000-4000-8000-00000000000f',
  cliente2: '00000000-0000-4000-8000-000000000010',
  cupon: '00000000-0000-4000-8000-000000000011',
  venta1: '00000000-0000-4000-8000-000000000012', // PAGADA, agosto, suc1, 10000
  venta2: '00000000-0000-4000-8000-000000000013', // PAGADA, agosto, suc2, 30000
  venta3: '00000000-0000-4000-8000-000000000014', // PENDIENTE, agosto, suc1, 99999
  venta4: '00000000-0000-4000-8000-000000000015', // PAGADA, julio, suc1, 20000
  venta5: '00000000-0000-4000-8000-000000000019', // PAGADA, agosto, suc1, SIN cliente
  venta6: '00000000-0000-4000-8000-00000000001a', // PAGADA, agosto, suc1, cliente1 otra vez
  venta7: '00000000-0000-4000-8000-00000000001b', // PAGADA, 31-ago 16:45, suc1, cliente2
  reserva1: '00000000-0000-4000-8000-000000000016',
  reserva2: '00000000-0000-4000-8000-000000000017',
  orden1: '00000000-0000-4000-8000-000000000018',
};

const AGOSTO = { desde: '2026-08-01', hasta: '2026-08-31' };
const JULIO = { desde: '2026-07-01', hasta: '2026-07-31' };

function ficha(p: Partial<FichaConsultaDto>): FichaConsultaDto {
  return plainToInstance(FichaConsultaDto, { orden: 'desc', limite: 50, ...p });
}

describe('MotorConsulta contra Postgres real (los numeros)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let motor: MotorConsultaService;

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    ds = app.get(DataSource);
    motor = app.get(MotorConsultaService);
    await limpiar(ds);
    await sembrar(ds);
  });

  afterAll(async () => {
    await limpiar(ds);
    await app.close();
  });

  it('ingresos de agosto: suma solo las PAGADAS, ignora la PENDIENTE', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: AGOSTO }),
    );
    // A mano: venta1 (10000) + venta2 (30000) + venta5 (5000) + venta6 (5000)
    //       + venta7 (10000, el 31 a las 16:45) = 60000.
    // venta3 esta PENDIENTE (99999) y NO entra. venta4 es de julio.
    expect(filas).toHaveLength(1);
    expect(filas[0].valor).toBe(60000);
  });

  it('el ultimo dia del rango entra COMPLETO, no solo su medianoche', async () => {
    // venta7 es del 2026-08-31 a las 16:45. `hasta` se pide en YYYY-MM-DD y las
    // columnas son timestamp: con `v."createdAt" <= '2026-08-31'` Postgres compara
    // contra la MEDIANOCHE del 31 y esa venta queda afuera. El reporte de agosto
    // daria 50000 y nadie notaria que falta el ultimo dia entero.
    const agosto = await motor.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: AGOSTO }),
    );
    expect(agosto[0].valor).toBe(60000);

    // Y el dia siguiente sigue afuera: el arreglo incluye el 31 completo, no corre el borde.
    const hastaEl30 = await motor.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { desde: '2026-08-01', hasta: '2026-08-30' } }),
    );
    expect(hastaEl30[0].valor).toBe(50000);
  });

  it('ingresos por sucursal: dos filas con los totales de cada una', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'sucursal', filtros: AGOSTO }),
    );
    const porNombre = Object.fromEntries(filas.map((f) => [f.etiqueta, f.valor]));
    expect(porNombre['Sucursal Sur']).toBe(30000);   // venta2
    // venta1 (10000) + venta5 (5000) + venta6 (5000) + venta7 (10000); la PENDIENTE no suma
    expect(porNombre['Sucursal Norte']).toBe(30000);
  });

  it('unidades por categoria: solo las de ventas pagadas', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'unidades', agruparPor: 'categoria', filtros: AGOSTO }),
    );
    const porNombre = Object.fromEntries(filas.map((f) => [f.etiqueta, f.valor]));
    // A mano, sumando `vi.cantidad` de las lineas de ventas PAGADAS de agosto:
    //   Blusas   = venta1 L2 (1) + venta2 (5) + venta5 (1) = 7
    //   Vestidos = venta1 L1 (2) + venta6 (1) + venta7 (2) = 5
    // Las 40 unidades de la venta PENDIENTE no entran.
    expect(porNombre['Blusas']).toBe(7);
    expect(porNombre['Vestidos']).toBe(5);
  });

  it('ingresos por categoria salen de las LINEAS, no del total de la venta', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'categoria', filtros: AGOSTO }),
    );
    const porNombre = Object.fromEntries(filas.map((f) => [f.etiqueta, f.valor]));

    // A mano, sumando `vi.subtotal_cents` de las lineas de ventas PAGADAS de agosto:
    //   Vestidos = venta1 L1 (6000) + venta6 (5000) + venta7 (10000) = 21000
    //   Blusas   = venta1 L2 (4000) + venta2 (30000) + venta5 (5000) = 39000
    //
    // Con `SUM(v.total_cents)` y el join a venta_items, venta1 se contaba ENTERA en
    // las dos categorias: Vestidos daba 25000 (10000 en vez de 6000) y Blusas 45000.
    expect(porNombre['Vestidos']).toBe(21000);
    expect(porNombre['Blusas']).toBe(39000);

    // Y la propiedad que importa: la suma de las categorias es el total del periodo.
    // Con el fan-out daba 70000 contra un total de 60000 y nadie lo notaba.
    const suma = filas.reduce((acc, f) => acc + f.valor, 0);
    const total = await motor.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: AGOSTO }),
    );
    expect(suma).toBe(total[0].valor);
    expect(suma).toBe(60000);
  });

  it('ingresos por producto tampoco se inflan con el total de la venta', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'producto', filtros: AGOSTO }),
    );
    const porNombre = Object.fromEntries(filas.map((f) => [f.etiqueta, f.valor]));
    // Un producto por categoria en esta siembra, asi que los numeros coinciden.
    expect(porNombre['Vestido Largo']).toBe(21000);
    expect(porNombre['Blusa Seda']).toBe(39000);
  });

  it('descuentos y ticket promedio por categoria/producto son 400, no un numero inventado', async () => {
    // Los dos viven en la CABECERA de la venta (descuento_cents, total_cents). Con el
    // join a venta_items el descuento de venta1 se contaria DOS veces (2000 en vez de
    // 1000), y repartirlo entre lineas exigiria una regla de prorrateo que el negocio
    // nunca declaro. Antes que devolver un numero inventado, se rechaza la combinacion.
    for (const metrica of ['descuentos', 'ticket_promedio'] as const) {
      for (const agruparPor of ['categoria', 'producto'] as const) {
        await expect(
          motor.ejecutar(ficha({ metrica, agruparPor, filtros: AGOSTO })),
        ).rejects.toThrow(CombinacionInvalidaException);
      }
    }
  });

  it('el descuento total de agosto no se duplica por las lineas de venta1', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'descuentos', agruparPor: 'ninguno', filtros: AGOSTO }),
    );
    // Solo venta1 tiene descuento (1000) y tiene DOS lineas. El valor correcto es 1000.
    expect(filas[0].valor).toBe(1000);
  });

  it('ticket promedio de agosto: (10000 + 30000 + 5000 + 5000 + 10000) / 5', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'ticket_promedio', agruparPor: 'ninguno', filtros: AGOSTO }),
    );
    expect(filas[0].valor).toBe(12000);
  });

  it('stock disponible por sucursal, sin dimension temporal', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'stock_disponible', agruparPor: 'sucursal' }),
    );
    const porNombre = Object.fromEntries(filas.map((f) => [f.etiqueta, f.valor]));
    expect(porNombre['Sucursal Norte']).toBe(7);
    expect(porNombre['Sucursal Sur']).toBe(3);
  });

  it('cantidad de reservas por estado, filtrando por fecha de CREACION', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'cantidad_reservas', agruparPor: 'estado', filtros: AGOSTO }),
    );
    // reserva1 se creo el 2026-08-02; reserva2 el 2026-07-20 y queda fuera.
    expect(filas).toHaveLength(1);
    expect(filas[0].etiqueta).toBe('CANCELADA');
    expect(filas[0].valor).toBe(1);
  });

  it('las mismas reservas, filtrando por fecha PREVISTA, dan otra cosa', async () => {
    const filas = await motor.ejecutar(
      ficha({
        metrica: 'cantidad_reservas', agruparPor: 'estado',
        campoFecha: 'prevista', filtros: AGOSTO,
      }),
    );
    // Por fecha prevista, la que cae en agosto es reserva2 (03-08), no reserva1 (05-09).
    // Esta prueba es la que demuestra que las dos fechas NO son intercambiables.
    expect(filas).toHaveLength(1);
    expect(filas[0].etiqueta).toBe('CONFIRMADA');
    expect(filas[0].valor).toBe(1);
  });

  it('canjes de cupon salen de ventas y respetan el periodo', async () => {
    const enAgosto = await motor.ejecutar(
      ficha({ metrica: 'canjes_cupon', agruparPor: 'cupon', filtros: AGOSTO }),
    );
    expect(enAgosto[0].etiqueta).toBe('AGOSTO10');
    expect(enAgosto[0].valor).toBe(1);

    const enJulio = await motor.ejecutar(
      ficha({ metrica: 'canjes_cupon', agruparPor: 'cupon', filtros: JULIO }),
    );
    // Si el motor leyera cupones.usos_actuales (que vale 99 y no tiene fecha),
    // los dos periodos darian lo mismo. Esta prueba es la que lo impide.
    expect(enJulio).toHaveLength(0);
  });

  it('unidades pedidas y recibidas salen del jsonb de la orden', async () => {
    const pedidas = await motor.ejecutar(
      ficha({ metrica: 'unidades_pedidas', agruparPor: 'proveedor', filtros: AGOSTO }),
    );
    expect(pedidas[0].etiqueta).toBe('Textiles SA');
    expect(pedidas[0].valor).toBe(10);

    const recibidas = await motor.ejecutar(
      ficha({ metrica: 'unidades_recibidas', agruparPor: 'proveedor', filtros: AGOSTO }),
    );
    expect(recibidas[0].valor).toBe(6);
  });

  it('clientes activos cuenta clientes distintos y no se infla con ventas sin cliente', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'clientes_activos', agruparPor: 'ninguno', filtros: AGOSTO }),
    );
    // En agosto hay 5 ventas PAGADAS: una sin cliente, cliente1 aparece en dos
    // (venta1, venta6) y cliente2 en dos (venta2, venta7).
    // Un COUNT(v.id) daria 5. Solo contar clientes DISTINTOS da 2.
    expect(filas[0].valor).toBe(2);
  });

  it('agrupar ingresos por cliente etiqueta con el nombre real', async () => {
    const filas = await motor.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'cliente', filtros: AGOSTO }),
    );
    const nombres = filas.map((f) => f.etiqueta).sort();
    expect(nombres).toEqual(['Ana Perez', 'Luz Rojas']);
  });

  describe('filtrar por categoria o por producto', () => {
    it('unidades de Vestidos cuenta SOLO las lineas de Vestidos', async () => {
      const filas = await motor.ejecutar(
        ficha({
          metrica: 'unidades', agruparPor: 'ninguno',
          filtros: { ...AGOSTO, categoriaId: ID.cat1 },
        }),
      );
      // A mano: venta1 L1 (2) + venta6 (1) + venta7 (2) = 5.
      // Si el recorte fuera con EXISTS sobre la venta entera, entrarian tambien la
      // Blusa de venta1 y daria 6: seria "unidades de las ventas que llevaban un
      // vestido", no "unidades de Vestidos".
      expect(filas[0].valor).toBe(5);
    });

    it('cantidad de ventas que incluyeron una categoria, sin contar dos veces la que tiene dos lineas', async () => {
      const vestidos = await motor.ejecutar(
        ficha({ metrica: 'cantidad_ventas', agruparPor: 'ninguno', filtros: { ...AGOSTO, categoriaId: ID.cat1 } }),
      );
      // venta1, venta6 y venta7 llevan Vestidos. venta1 tiene DOS lineas y aun asi
      // cuenta una sola vez.
      expect(vestidos[0].valor).toBe(3);

      const blusas = await motor.ejecutar(
        ficha({ metrica: 'cantidad_ventas', agruparPor: 'ninguno', filtros: { ...AGOSTO, categoriaId: ID.cat2 } }),
      );
      // venta1, venta2 y venta5.
      expect(blusas[0].valor).toBe(3);
    });

    it('el filtro no depende de por que se agrupa: anda junto a la dimension cliente', async () => {
      const filas = await motor.ejecutar(
        ficha({
          metrica: 'cantidad_ventas', agruparPor: 'cliente',
          filtros: { ...AGOSTO, productoId: ID.prod1 },
        }),
      );
      const porNombre = Object.fromEntries(filas.map((f) => [f.etiqueta, f.valor]));
      // Ana Perez compro Vestido Largo en venta1 y venta6; Luz Rojas en venta7.
      expect(porNombre['Ana Perez']).toBe(2);
      expect(porNombre['Luz Rojas']).toBe(1);
    });

    it('stock por categoria: "cuanto tengo de Vestidos"', async () => {
      const vestidos = await motor.ejecutar(
        ficha({ metrica: 'stock_disponible', agruparPor: 'ninguno', filtros: { categoriaId: ID.cat1 } }),
      );
      expect(vestidos[0].valor).toBe(7);   // var1 en suc1

      const blusas = await motor.ejecutar(
        ficha({ metrica: 'stock_disponible', agruparPor: 'ninguno', filtros: { productoId: ID.prod2 } }),
      );
      expect(blusas[0].valor).toBe(3);     // var2 en suc2
    });

    it('las metricas de dinero de cabecera rechazan estos filtros', async () => {
      for (const metrica of ['ingresos', 'descuentos', 'ticket_promedio'] as const) {
        await expect(
          motor.ejecutar(ficha({ metrica, agruparPor: 'ninguno', filtros: { ...AGOSTO, categoriaId: ID.cat1 } })),
        ).rejects.toThrow(CombinacionInvalidaException);
      }
      // La pregunta "cuanto vendi de Vestidos" tiene respuesta exacta por otra via:
      // agrupar ingresos por categoria y leer la fila.
      const porCategoria = await motor.ejecutar(
        ficha({ metrica: 'ingresos', agruparPor: 'categoria', filtros: AGOSTO }),
      );
      const vestidos = porCategoria.find((f) => f.etiqueta === 'Vestidos');
      expect(vestidos?.valor).toBe(21000);
    });
  });

  it('un filtro en null no vacia el reporte contra la base real', async () => {
    // Gemini emite null de rutina para las opcionales que no lleno, y @IsOptional()
    // lo deja pasar. Con `sucursal_id = NULL` esta consulta devolvia CERO filas y el
    // usuario leia "no hubo ventas en agosto".
    const filas = await motor.ejecutar(
      ficha({
        metrica: 'ingresos', agruparPor: 'ninguno',
        filtros: { ...AGOSTO, sucursalId: null, clienteId: null } as never,
        limite: null as never,
      }),
    );
    expect(filas).toHaveLength(1);
    expect(filas[0].valor).toBe(60000);
  });

  it('un filtro de fecha sobre una metrica de inventario es 400', async () => {
    await expect(
      motor.ejecutar(ficha({ metrica: 'stock_disponible', agruparPor: 'sucursal', filtros: AGOSTO })),
    ).rejects.toThrow(CombinacionInvalidaException);
  });

  it('comparar agosto contra julio da la variacion real', async () => {
    // La comparacion vive en IaService, no en el motor: corre la MISMA consulta
    // dos veces con distinto rango. Esta prueba verifica que los dos periodos se
    // calculan igual contra datos reales, que es justamente lo que esa estrategia
    // busca garantizar.
    const ia = app.get(IaService);
    const res = await ia.consultar(
      ficha({
        metrica: 'ingresos', agruparPor: 'ninguno',
        filtros: AGOSTO, compararCon: JULIO,
      }),
      { sub: ID.cliente1, email: 'admin@test.com', role: 'ADMIN', sucursalId: null },
    );

    // A mano: agosto = venta1 (10000) + venta2 (30000) + venta5 (5000) + venta6 (5000)
    //                + venta7 (10000) = 60000.
    //         julio  = venta4 (20000). Variacion = +40000, o sea +200%.
    expect(res.filas[0].valor).toBe(60000);
    expect(res.comparacion).not.toBeNull();
    expect(res.comparacion?.variaciones[0]).toMatchObject({
      actual: 60000, anterior: 20000, deltaAbsoluto: 40000, deltaPorcentual: 200,
    });
  });
});

/**
 * Borra solo las filas de esta prueba y en orden de dependencia (hijos antes que padres).
 *
 * Explicita a proposito: `inventario_sucursal` y `movimientos_inventario` tienen id
 * generado, no uno de los fijos, asi que hay que borrarlos por `variante_id` o quedan
 * huerfanos — y como sus FK impiden borrar las variantes, la limpieza fallaria en silencio
 * y la corrida siguiente veria el stock DUPLICADO. Nada de `.catch()` que trague errores:
 * si la limpieza falla, la prueba debe romper y decirlo.
 */
async function limpiar(ds: DataSource): Promise<void> {
  const ids = Object.values(ID);
  const variantes = [ID.var1, ID.var2];

  await ds.query(`DELETE FROM venta_items WHERE venta_id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM ventas WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM reserva_items WHERE reserva_id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM reservas WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM movimientos_inventario WHERE variante_id = ANY($1::uuid[])`, [variantes]);
  await ds.query(`DELETE FROM ordenes_compra WHERE id = ANY($1::uuid[])`, [ids]);
  await ds.query(`DELETE FROM inventario_sucursal WHERE variante_id = ANY($1::uuid[])`, [variantes]);
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
           VALUES ($1, 'Sucursal Norte', 'Av 1', $3, true), ($2, 'Sucursal Sur', 'Av 2', $3, true)`,
    [ID.suc1, ID.suc2, ID.ciudad]);
  await q(`INSERT INTO proveedores (id, razon_social, activo) VALUES ($1, 'Textiles SA', true)`, [ID.prov]);
  await q(`INSERT INTO temporadas (id, nombre, fecha_inicio, fecha_fin)
           VALUES ($1, 'Verano 2026', '2026-01-01', '2026-12-31')`, [ID.temp]);
  await q(`INSERT INTO colecciones (id, nombre, temporada_id, proveedor_id)
           VALUES ($1, 'Coleccion A', $2, $3)`, [ID.colec, ID.temp, ID.prov]);
  await q(`INSERT INTO categorias (id, nombre, slug, activo)
           VALUES ($1, 'Vestidos', 'vestidos', true), ($2, 'Blusas', 'blusas', true)`,
    [ID.cat1, ID.cat2]);
  await q(`INSERT INTO tallas (id, nombre, orden) VALUES ($1, 'M', 2)`, [ID.talla]);
  await q(`INSERT INTO colores (id, nombre, hex_code) VALUES ($1, 'Negro', '#000000')`, [ID.color]);
  await q(`INSERT INTO productos (id, titulo, slug, precio_cents, categoria_id, coleccion_id, activo, imagenes)
           VALUES ($1, 'Vestido Largo', 'vestido-largo', 10000, $3, $5, true, '[]'::jsonb),
                  ($2, 'Blusa Seda', 'blusa-seda', 5000, $4, $5, true, '[]'::jsonb)`,
    [ID.prod1, ID.prod2, ID.cat1, ID.cat2, ID.colec]);
  await q(`INSERT INTO variantes_producto (id, sku, producto_id, talla_id, color_id, activo)
           VALUES ($1, 'SKU-1', $3, $5, $6, true), ($2, 'SKU-2', $4, $5, $6, true)`,
    [ID.var1, ID.var2, ID.prod1, ID.prod2, ID.talla, ID.color]);

  // Stock: suc1 tiene 7 disponibles y 2 reservadas; suc2 tiene 3 disponibles.
  await q(`INSERT INTO inventario_sucursal
             (id, variante_id, sucursal_id, cantidad_disponible, cantidad_reservada, cantidad_en_transito)
           VALUES (gen_random_uuid(), $1, $3, 7, 2, 1), (gen_random_uuid(), $2, $4, 3, 0, 0)`,
    [ID.var1, ID.var2, ID.suc1, ID.suc2]);

  await q(`INSERT INTO usuarios (id, email, password_hash, full_name, role, is_active)
           VALUES ($1, 'c1@test.com', 'x', 'Ana Perez', 'CUSTOMER', true),
                  ($2, 'c2@test.com', 'x', 'Luz Rojas', 'CUSTOMER', true)`,
    [ID.cliente1, ID.cliente2]);

  await q(`INSERT INTO cupones (id, codigo, tipo_descuento, valor, fecha_inicio, fecha_fin, usos_actuales, activo)
           VALUES ($1, 'AGOSTO10', 'PORCENTAJE', 10, '2026-08-01', '2026-08-31', 99, true)`,
    [ID.cupon]);

  // Ventas. OJO: "createdAt" va entre comillas, es camelCase en la base.
  // venta5 y venta6 aislan la prueba de "clientes activos": sin ellas, la unica
  // venta sin cliente (venta3) coincidia con la unica PENDIENTE, y cada cliente
  // aparecia en una sola venta pagada, asi que COUNT(v.id) daba el mismo numero
  // que COUNT(DISTINCT v.cliente_id). Con venta5 (PAGADA, sin cliente) y venta6
  // (PAGADA, cliente1 de nuevo), agosto tiene 4 ventas pagadas pero solo 2
  // clientes distintos, y ahora si discrimina.
  //
  // venta7 es la unica sembrada con HORA: 2026-08-31 a las 16:45, el ultimo dia
  // del rango de agosto. Todas las demas estan a medianoche, que era el unico
  // instante que el viejo filtro `hasta <= '2026-08-31'` dejaba pasar — por eso
  // el defecto de `hasta` era invisible. Si alguien vuelve a poner `<=`, esta
  // venta desaparece de agosto y las pruebas de ingresos rompen.
  await q(`INSERT INTO ventas (id, cliente_id, sucursal_id, canal, estado,
                               subtotal_cents, descuento_cents, total_cents, cupon_id, "createdAt")
           VALUES ($1,  $5,   $7, 'WEB',        'PAGADA',    11000, 1000, 10000, $9,   '2026-08-10'),
                  ($2,  $6,   $8, 'PRESENCIAL', 'PAGADA',    30000,    0, 30000, NULL, '2026-08-20'),
                  ($3,  NULL, $7, 'WEB',        'PENDIENTE', 99999,    0, 99999, NULL, '2026-08-25'),
                  ($4,  $5,   $7, 'WEB',        'PAGADA',    20000,    0, 20000, NULL, '2026-07-15'),
                  ($10, NULL, $7, 'WEB',        'PAGADA',     5000,    0,  5000, NULL, '2026-08-12'),
                  ($11, $5,   $7, 'WEB',        'PAGADA',     5000,    0,  5000, NULL, '2026-08-14'),
                  ($12, $6,   $7, 'WEB',        'PAGADA',    10000,    0, 10000, NULL, '2026-08-31 16:45:00')`,
    [
      ID.venta1, ID.venta2, ID.venta3, ID.venta4, ID.cliente1, ID.cliente2, ID.suc1, ID.suc2, ID.cupon,
      ID.venta5, ID.venta6, ID.venta7,
    ]);

  // Items. venta1 tiene DOS lineas de categorias DISTINTAS a proposito: 2 Vestidos
  // por 6000 mas 1 Blusa por 4000, que suman su total de cabecera (10000). Es la
  // venta que destapa el fan-out: joinear venta_items para alcanzar `categoria`
  // duplica la fila de la venta, y sumar `v.total_cents` cuenta 10000 en Vestidos
  // Y otros 10000 en Blusas. Mientras toda venta tuvo una sola linea, el error era
  // invisible porque el total de cabecera coincidia con el de la unica linea.
  //
  // Las demas ventas pagadas tambien llevan lineas que suman su cabecera, asi los
  // ingresos por categoria reconcilian contra el total del periodo (60000).
  // venta3 (PENDIENTE) lleva 40 unidades, que NO deben contarse nunca.
  await q(`INSERT INTO venta_items (id, venta_id, variante_id, cantidad, precio_unit_cents, subtotal_cents)
           VALUES (gen_random_uuid(), $1, $4, 2, 3000,  6000),
                  (gen_random_uuid(), $1, $5, 1, 4000,  4000),
                  (gen_random_uuid(), $2, $5, 5, 6000, 30000),
                  (gen_random_uuid(), $3, $4, 40, 2500, 99999),
                  (gen_random_uuid(), $6, $5, 1, 5000,  5000),
                  (gen_random_uuid(), $7, $4, 1, 5000,  5000),
                  (gen_random_uuid(), $8, $4, 2, 5000, 10000)`,
    [ID.venta1, ID.venta2, ID.venta3, ID.var1, ID.var2, ID.venta5, ID.venta6, ID.venta7]);

  await q(`INSERT INTO reservas (id, cliente_id, sucursal_id, estado, fecha_hora_prevista, "createdAt")
           VALUES ($1, $3, $4, 'CANCELADA', '2026-09-05', '2026-08-02'),
                  ($2, $3, $4, 'CONFIRMADA', '2026-08-03', '2026-07-20')`,
    [ID.reserva1, ID.reserva2, ID.cliente1, ID.suc1]);
  await q(`INSERT INTO reserva_items (id, reserva_id, variante_id, cantidad)
           VALUES (gen_random_uuid(), $1, $3, 3), (gen_random_uuid(), $2, $3, 4)`,
    [ID.reserva1, ID.reserva2, ID.var1]);

  // Items va parametrizado (todo SQL parametrizado, sin excepcion aunque el
  // valor sea un uuid fijo): $5 lleva el jsonb ya serializado.
  await q(`INSERT INTO ordenes_compra (id, proveedor_id, sucursal_destino_id, usuario_id,
                                       estado, items, fecha_pedido)
           VALUES ($1, $2, $3, $4, 'RECIBIDA_PARCIAL', $5::jsonb, '2026-08-05')`,
    [
      ID.orden1, ID.prov, ID.suc1, ID.cliente1,
      JSON.stringify([{ varianteId: ID.var1, cantidadPedida: 10, cantidadRecibida: 6 }]),
    ]);
}
