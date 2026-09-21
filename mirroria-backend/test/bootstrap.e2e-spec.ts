import { readFileSync } from 'node:fs';

// No es una prueba de comportamiento sino de configuracion: no arranca la app,
// solo lee el archivo. Vive en test/ (junto a los .e2e-spec que si arrancan la
// app) porque documenta una regresion que solo se ve en produccion real, con
// bootstrap() de por medio. Ninguna otra prueba pasa por ese arranque: todos
// los demas .e2e-spec crean su propio TestingModule + createNestApplication
// directamente, sin llamar a bootstrap(), asi que un cambio aca no lo detecta
// nada mas.
describe('bootstrap de la app', () => {
  it('main.ts configura la app para recibir el cuerpo crudo', () => {
    // La firma del webhook (ver pagos.e2e-spec.ts) se calcula sobre los bytes
    // EXACTOS del cuerpo. Si el framework lo parsea antes de que la pasarela
    // pueda verificarlo, `req.rawBody` queda vacio, la firma no valida NUNCA y
    // el cobro con tarjeta muere en silencio — mientras el resto de la suite
    // sigue en verde, porque las pruebas unitarias simulan la pasarela y las
    // e2e arman la app por su cuenta sin pasar por este archivo. Por eso se
    // vigila el archivo directamente en vez de una peticion HTTP.
    const main = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
    // Sin espacios: un reformateo (prettier, por ejemplo) no debe romper esto
    // por un motivo ajeno a si la opcion sigue presente.
    expect(main.replace(/\s+/g, '')).toContain('rawBody:true');
  });
});
