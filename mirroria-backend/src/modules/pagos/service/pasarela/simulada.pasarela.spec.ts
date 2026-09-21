import { describe, expect, it } from 'vitest';
import { PasarelaSimulada } from './simulada.pasarela.js';

describe('PasarelaSimulada', () => {
  const pasarela = new PasarelaSimulada();

  it('siempre esta configurada: no necesita claves', () => {
    expect(pasarela.estaConfigurada()).toBe(true);
  });

  it('crea una sesion con una url a la que se puede ir', async () => {
    const sesion = await pasarela.crearSesion({
      montoCents: 25000, descripcion: 'Compra', referencia: 'v1',
      urlExito: 'http://app/ok', urlCancelacion: 'http://app/no',
    });
    expect(sesion.id).toMatch(/^sim_/);
    expect(sesion.url).toContain('http://app/ok');
  });

  it('acepta un evento con la firma convenida y lo devuelve como pagado', () => {
    const cuerpo = Buffer.from(JSON.stringify({ id: 'evt_1', sesionId: 'sim_1' }));
    const evento = pasarela.verificarEvento(cuerpo, 'firma-simulada');
    expect(evento).toEqual({ id: 'evt_1', tipo: 'pagado', sesionId: 'sim_1' });
  });

  it('rechaza un evento con firma equivocada', () => {
    const cuerpo = Buffer.from(JSON.stringify({ id: 'evt_1', sesionId: 'sim_1' }));
    // Aun simulada, la pasarela tiene que RECHAZAR una firma invalida: si no,
    // las pruebas del camino feliz pasarian con cualquier cosa.
    expect(() => pasarela.verificarEvento(cuerpo, 'cualquiera')).toThrow();
  });
});
