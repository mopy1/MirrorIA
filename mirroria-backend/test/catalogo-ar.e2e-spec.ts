import { DataSource } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

/**
 * Contrato de los campos de AR del producto (`modeloArUrl` y
 * `arOverlayImageUrl`) a traves del HTTP real, con el mismo ValidationPipe
 * que pone main.ts.
 *
 * Va por HTTP y no llamando al servicio a proposito: el punto entero es si el
 * `ValidationPipe({ whitelist: true })` deja pasar un `null` en un campo
 * `@IsOptional() @IsUrl()`. El panel admin manda `null` para BORRAR la URL, y
 * si el pipe lo filtrara o lo rechazara, el boton de borrar no funcionaria en
 * produccion aunque el servicio este bien.
 */
const BASE = '/api/v1/catalogo/productos';

const ID = {
  prov: '00000000-0000-4000-9002-000000000003',
  temp: '00000000-0000-4000-9002-000000000004',
  colec: '00000000-0000-4000-9002-000000000005',
  cat: '00000000-0000-4000-9002-000000000006',
};

async function tokenDeAdmin(app: INestApplication<App>): Promise<string> {
  const email = `catalogo-ar-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  await request(app.getHttpServer())
    .post('/api/v1/seguridad/auth/register')
    .send({ email, password: 'Password123', fullName: 'E2E Catalogo AR' })
    .expect(201);
  const ds = app.get(DataSource);
  await ds.query('UPDATE usuarios SET role = $2 WHERE email = $1', [email, 'ADMIN']);
  const login = await request(app.getHttpServer())
    .post('/api/v1/seguridad/auth/login')
    .send({ email, password: 'Password123' })
    .expect(200);
  return (login.body as { accessToken: string }).accessToken;
}

/** Minimo para poder crear un producto. Ojo: `proveedores` usa
 * `razon_social` y NO tiene `nombre`, y `temporadas` exige las dos fechas. */
async function sembrar(ds: DataSource) {
  await ds.query(`INSERT INTO proveedores (id, razon_social, activo)
                  VALUES ($1,'AR-Prov',true) ON CONFLICT (id) DO NOTHING`, [ID.prov]);
  await ds.query(`INSERT INTO temporadas (id, nombre, fecha_inicio, fecha_fin, activo)
                  VALUES ($1,'AR-Temp','2026-01-01','2026-12-31',true)
                  ON CONFLICT (id) DO NOTHING`, [ID.temp]);
  await ds.query(`INSERT INTO colecciones (id, nombre, proveedor_id, temporada_id, activo)
                  VALUES ($1,'AR-Colec',$2,$3,true) ON CONFLICT (id) DO NOTHING`,
                 [ID.colec, ID.prov, ID.temp]);
  await ds.query(`INSERT INTO categorias (id, nombre, slug, activo)
                  VALUES ($1,'AR-Cat','ar-cat',true) ON CONFLICT (id) DO NOTHING`, [ID.cat]);
}

describe('Catalogo - campos de AR del producto (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api/v1');
    // Identico a main.ts: sin esto el test probaria otra configuracion.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await sembrar(app.get(DataSource));
    token = await tokenDeAdmin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  async function crearProducto(extra: Record<string, unknown> = {}) {
    const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const res = await request(app.getHttpServer())
      .post(BASE)
      .set(auth())
      .send({
        categoriaId: ID.cat,
        coleccionId: ID.colec,
        titulo: `Vestido AR ${sufijo}`,
        slug: `vestido-ar-${sufijo}`,
        precioCents: 34990,
        ...extra,
      })
      .expect(201);
    return res.body as { id: string; modeloArUrl: string | null; arOverlayImageUrl: string | null };
  }

  const leer = async (id: string) =>
    (await request(app.getHttpServer()).get(`${BASE}/${id}`).expect(200)).body as {
      modeloArUrl: string | null;
      arOverlayImageUrl: string | null;
    };

  it('un producto se crea con la URL de su modelo 3D y la devuelve al leerlo', async () => {
    const creado = await crearProducto({ modeloArUrl: 'https://cdn.test/vestido.glb' });
    expect(creado.modeloArUrl).toBe('https://cdn.test/vestido.glb');
    expect((await leer(creado.id)).modeloArUrl).toBe('https://cdn.test/vestido.glb');
  });

  it('mandar null BORRA la URL del modelo 3D', async () => {
    // Es el caso que el panel admin necesita para DESASOCIAR un .glb. Con
    // `undefined` el campo no viaja y el servicio no lo toca nunca, asi que
    // la URL vieja quedaba para siempre.
    const creado = await crearProducto({ modeloArUrl: 'https://cdn.test/viejo.glb' });
    await request(app.getHttpServer())
      .patch(`${BASE}/${creado.id}`)
      .set(auth())
      .send({ modeloArUrl: null })
      .expect(200);
    expect((await leer(creado.id)).modeloArUrl).toBeNull();
  });

  it('mandar null BORRA tambien la imagen de overlay AR', async () => {
    const creado = await crearProducto({ arOverlayImageUrl: 'https://cdn.test/overlay.png' });
    await request(app.getHttpServer())
      .patch(`${BASE}/${creado.id}`)
      .set(auth())
      .send({ arOverlayImageUrl: null })
      .expect(200);
    expect((await leer(creado.id)).arOverlayImageUrl).toBeNull();
  });

  it('omitir el campo NO lo borra: deja la URL que ya tenia', async () => {
    // La otra mitad del contrato. Si esto fallara, cualquier edicion de
    // precio o titulo borraria el modelo 3D sin que nadie lo pida.
    const creado = await crearProducto({ modeloArUrl: 'https://cdn.test/queda.glb' });
    await request(app.getHttpServer())
      .patch(`${BASE}/${creado.id}`)
      .set(auth())
      .send({ titulo: 'Otro titulo' })
      .expect(200);
    expect((await leer(creado.id)).modeloArUrl).toBe('https://cdn.test/queda.glb');
  });

  it('rechaza una URL con esquema peligroso', async () => {
    const sufijo = Date.now();
    await request(app.getHttpServer())
      .post(BASE)
      .set(auth())
      .send({
        categoriaId: ID.cat,
        coleccionId: ID.colec,
        titulo: 'Vestido malo',
        slug: `vestido-malo-${sufijo}`,
        precioCents: 1000,
        modeloArUrl: 'javascript:alert(1)',
      })
      .expect(400);
  });

  it('PERO acepta cualquier cosa que PAREZCA una URL, aunque no sea un .glb', async () => {
    // Hallazgo real, medido: `@IsUrl({ require_tld: false })` es mucho mas
    // permisivo de lo que su nombre sugiere. Acepta 'no-es-una-url',
    // 'foto.png' y 'ftp://x/v.glb'; solo rechaza esquemas raros, espacios y
    // cosas como '<script>'. El `require_tld: false` esta ahi a proposito,
    // para que 'http://localhost:3000/v.glb' siga sirviendo en desarrollo.
    //
    // O sea: EL BACKEND NO GARANTIZA que `modeloArUrl` sea un .glb usable.
    // Por eso `resolverFuenteModelo` del movil no le cree y exige http(s) +
    // extension .glb/.gltf, cayendo al modelo empaquetado si no. Este test
    // existe para que, si alguien endurece el DTO algun dia, se entere de
    // que esa garantia hoy NO existe.
    const creado = await crearProducto({ modeloArUrl: 'foto.png' });
    expect(creado.modeloArUrl).toBe('foto.png');
  });

  it('sin ser ADMIN no se puede tocar el modelo 3D de una prenda', async () => {
    const creado = await crearProducto();
    await request(app.getHttpServer())
      .patch(`${BASE}/${creado.id}`)
      .send({ modeloArUrl: 'https://cdn.test/intruso.glb' })
      .expect(401);
  });
});
