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
  const { email } = await registrarCustomer(app);
  await app.get(DataSource).query("UPDATE usuarios SET role='ADMIN' WHERE email=$1", [email]);
  const login = await request(app.getHttpServer())
    .post('/api/v1/seguridad/auth/login')
    .send({ email, password: 'Password123' })
    .expect(200);
  return (login.body as { accessToken: string }).accessToken;
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
