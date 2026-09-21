import { DataSource } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

const RUTA = '/api/v1/ia/reportes/consulta';

/** Registra un usuario nuevo y devuelve su token y su email. El registro publico siempre da CUSTOMER. */
async function registrarCustomer(app: INestApplication<App>): Promise<{ email: string; token: string }> {
  const email = `ia-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  const res = await request(app.getHttpServer())
    .post('/api/v1/seguridad/auth/register')
    .send({ email, password: 'Password123', fullName: 'E2E IA' })
    .expect(201);
  return { email, token: (res.body as { accessToken: string }).accessToken };
}

async function tokenDeCustomer(app: INestApplication<App>): Promise<string> {
  return (await registrarCustomer(app)).token;
}

/**
 * Registra un CUSTOMER, lo promueve a ADMIN por query directa y vuelve a loguear
 * para obtener un token con el rol nuevo (el rol viaja firmado dentro del JWT:
 * el token del register sigue diciendo CUSTOMER aunque la fila ya cambio).
 */
async function tokenDeAdmin(app: INestApplication<App>): Promise<string> {
  return (await usuarioConRol(app, 'ADMIN')).token;
}

/**
 * Registra un CUSTOMER, lo promueve al rol pedido por query directa y vuelve a
 * loguear. La `sucursal_id` queda en NULL salvo que se pase una: una cuenta de
 * ENCARGADO_SUCURSAL sin sucursal asignada es justamente el caso que el modulo
 * trata aparte, y hay que poder construirlo.
 */
async function usuarioConRol(
  app: INestApplication<App>,
  role: string,
  sucursalId: string | null = null,
): Promise<{ id: string; email: string; token: string }> {
  const { email } = await registrarCustomer(app);
  const ds = app.get(DataSource);
  await ds.query('UPDATE usuarios SET role = $2, sucursal_id = $3 WHERE email = $1', [
    email, role, sucursalId,
  ]);
  const login = await request(app.getHttpServer())
    .post('/api/v1/seguridad/auth/login')
    .send({ email, password: 'Password123' })
    .expect(200);
  const filas = (await ds.query('SELECT id FROM usuarios WHERE email = $1', [email])) as Array<{
    id: string;
  }>;
  return { id: filas[0].id, email, token: (login.body as { accessToken: string }).accessToken };
}

describe('IA - reportes (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    // Replica main.ts EXACTAMENTE: el pipe global NO trae forbidNonWhitelisted.
    // Si el e2e lo agregara aca, estaria probando una configuracion que en produccion
    // no existe, y el 400 por propiedad inventada pasaria por el motivo equivocado.
    // Ese 400 lo tiene que dar el pipe con alcance de ruta del propio IaController.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sin token devuelve 401', async () => {
    await request(app.getHttpServer())
      .post(RUTA)
      .send({ metrica: 'ingresos', agruparPor: 'ninguno' })
      .expect(401);
  });

  it('un CUSTOMER devuelve 403', async () => {
    const token = await tokenDeCustomer(app);
    await request(app.getHttpServer())
      .post(RUTA)
      .set('Authorization', `Bearer ${token}`)
      .send({ metrica: 'ingresos', agruparPor: 'ninguno' })
      .expect(403);
  });

  it('una ficha con propiedades inventadas devuelve 400', async () => {
    // Con un CUSTOMER esto daria 403 antes de llegar al pipe: los Guards de Nest
    // corren ANTES que los Pipes de parametro, asi que RolesGuard corta primero.
    // Para ejercer el 400 del PIPE_FICHA hace falta un rol que pase el guard.
    const token = await tokenDeAdmin(app);
    await request(app.getHttpServer())
      .post(RUTA)
      .set('Authorization', `Bearer ${token}`)
      .send({ metrica: 'ingresos', agruparPor: 'ninguno', sqlCrudo: 'DROP TABLE ventas' })
      .expect(400);
  });

  it('un ADMIN consulta y recibe 200 con filas', async () => {
    const token = await tokenDeAdmin(app);
    const res = await request(app.getHttpServer())
      .post(RUTA)
      .set('Authorization', `Bearer ${token}`)
      .send({ metrica: 'ingresos', agruparPor: 'ninguno' })
      .expect(200);
    expect(res.body.filas).toBeDefined();
  });

  it('un ENCARGADO_SUCURSAL SIN sucursal asignada recibe 403 por HTTP', async () => {
    // El rol pasa el RolesGuard (esta en @Roles), asi que el 403 no puede venir de ahi:
    // lo tiene que dar SinSucursalAsignadaException dentro del servicio. Dejar el filtro
    // vacio abriria TODAS las sucursales, que es lo contrario de lo que se busca.
    const { token } = await usuarioConRol(app, 'ENCARGADO_SUCURSAL');
    const res = await request(app.getHttpServer())
      .post(RUTA)
      .set('Authorization', `Bearer ${token}`)
      .send({ metrica: 'ingresos', agruparPor: 'ninguno' })
      .expect(403);

    // El mensaje tiene que explicar QUE pasa, no ser el 403 generico del guard.
    expect(JSON.stringify(res.body)).toContain('sucursal');
    expect(res.body.filas).toBeUndefined();
  });

  describe('GET /ia/interacciones', () => {
    const HISTORIAL = '/api/v1/ia/interacciones';

    it('sin token es 401 y con un CUSTOMER es 403', async () => {
      await request(app.getHttpServer()).get(HISTORIAL).expect(401);
      const token = await tokenDeCustomer(app);
      await request(app.getHttpServer())
        .get(HISTORIAL)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('un ADMIN ve las de todos y un ENCARGADO_SUCURSAL solo las propias', async () => {
      const ds = app.get(DataSource);
      const admin = await usuarioConRol(app, 'ADMIN');
      const encargado = await usuarioConRol(app, 'ENCARGADO_SUCURSAL');

      // Sin IA_API_KEY no hay forma de crear una interaccion por HTTP (POST /ia/reportes
      // corta en 503 antes de registrar), asi que se insertan directo. Lo que se prueba
      // aca es la LECTURA: la ruta, el guard, el alcance por rol y la forma del DTO
      // contra el repositorio real, no contra uno simulado.
      const marca = `hist-${Date.now()}`;
      await ds.query(
        `INSERT INTO interacciones_ia (usuario_id, tipo, input_text, output_text)
         VALUES ($1, 'REPORTE_VOZ', $3, 'respuesta del admin'),
                ($2, 'REPORTE_VOZ', $4, 'respuesta del encargado')`,
        [admin.id, encargado.id, `${marca}-admin`, `${marca}-encargado`],
      );

      const delEncargado = await request(app.getHttpServer())
        .get(HISTORIAL)
        .set('Authorization', `Bearer ${encargado.token}`)
        .expect(200);
      const textosEncargado = (delEncargado.body as Array<{ inputText: string }>).map(
        (i) => i.inputText,
      );
      expect(textosEncargado).toContain(`${marca}-encargado`);
      expect(textosEncargado).not.toContain(`${marca}-admin`);

      const delAdmin = await request(app.getHttpServer())
        .get(HISTORIAL)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);
      const textosAdmin = (delAdmin.body as Array<{ inputText: string }>).map((i) => i.inputText);
      expect(textosAdmin).toContain(`${marca}-admin`);
      expect(textosAdmin).toContain(`${marca}-encargado`);

      // Y sale el DTO, no la entidad cruda: nada de usuarioId ni updatedAt por la red.
      const fila = (delAdmin.body as Array<Record<string, unknown>>)[0];
      expect(fila).toHaveProperty('id');
      expect(fila).toHaveProperty('createdAt');
      expect(fila).not.toHaveProperty('usuarioId');
      expect(fila).not.toHaveProperty('updatedAt');

      await ds.query('DELETE FROM interacciones_ia WHERE usuario_id = ANY($1::uuid[])', [
        [admin.id, encargado.id],
      ]);
    });
  });

  it('sin IA_API_KEY, /reportes da 503 pero /reportes/consulta sigue en 200', async () => {
    // Este entorno de pruebas no trae IA_API_KEY (ver .env.example): la rama es
    // determinista justo por eso. Confirma que el modulo real conecta
    // GeminiProveedor con IaService por inyeccion y que el filtro global
    // traduce IaNoConfiguradaException al 503 correcto — y, la propiedad que
    // mas importa conservar, que el camino manual sigue vivo sin clave.
    const token = await tokenDeAdmin(app);

    await request(app.getHttpServer())
      .post('/api/v1/ia/reportes')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'cuanto vendi este mes por sucursal' })
      .expect(503);

    await request(app.getHttpServer())
      .post(RUTA)
      .set('Authorization', `Bearer ${token}`)
      .send({ metrica: 'ingresos', agruparPor: 'ninguno' })
      .expect(200);
  });
});
