import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PagosController } from './pagos.controller.js';
import type { PagosService } from '../service/pagos.service.js';
import type { ExpiracionService } from '../service/expiracion.service.js';
import type { CobroQrService } from '../service/qr/cobro-qr.service.js';
import type { RegistroPasarelasService } from '../service/pasarela/registro-pasarelas.service.js';

describe('PagosController — Catálogo de Pasarelas', () => {
  let controller: PagosController;
  let pagosService: PagosService;
  let expiracionService: ExpiracionService;
  let cobroQrService: CobroQrService;
  let registroPasarelas: { listar: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    pagosService = {} as unknown as PagosService;
    expiracionService = {} as unknown as ExpiracionService;
    cobroQrService = {} as unknown as CobroQrService;
    registroPasarelas = {
      listar: vi.fn().mockReturnValue([
        { id: 'WAYRA', nombre: 'QR Simple', estado: 'DISPONIBLE' },
        { id: 'STRIPE', nombre: 'Stripe', estado: 'DISPONIBLE' },
      ]),
    };

    controller = new PagosController(
      pagosService,
      expiracionService,
      cobroQrService,
      registroPasarelas as unknown as RegistroPasarelasService,
    );
  });

  it('GET /pagos/pasarelas sin contexto lista todas', () => {
    const res = controller.listarPasarelas();
    expect(registroPasarelas.listar).toHaveBeenCalledWith({ contexto: undefined });
    expect(res).toHaveLength(2);
  });

  it('GET /pagos/pasarelas?contexto=checkout filtra por checkout', () => {
    controller.listarPasarelas('checkout');
    expect(registroPasarelas.listar).toHaveBeenCalledWith({ contexto: 'checkout' });
  });

  it('GET /pagos/pasarelas?contexto=suscripcion filtra por suscripción', () => {
    controller.listarPasarelas('suscripcion');
    expect(registroPasarelas.listar).toHaveBeenCalledWith({ contexto: 'suscripcion' });
  });
});
