import { Injectable } from '@nestjs/common';
import { PasarelaNoConfiguradaException } from '../../exception/pasarela-no-configurada.exception.js';
import type {
  IPasarelaProveedor,
  PasarelaId,
  PasarelaMetadata,
} from './pasarela.interface.js';
import { ManualPasarela } from './manual.pasarela.js';
import { PaypalPasarela } from './paypal.pasarela.js';
import { QrBancarioPasarela } from './qr-bancario.pasarela.js';
import { PasarelaStripe } from './stripe.pasarela.js';
import { WayraPasarela } from './wayra.pasarela.js';

@Injectable()
export class RegistroPasarelasService {
  private readonly proveedores = new Map<PasarelaId, IPasarelaProveedor>();

  constructor(
    private readonly stripe: PasarelaStripe,
    private readonly wayra: WayraPasarela,
    private readonly manual: ManualPasarela,
    private readonly paypal: PaypalPasarela,
    private readonly qrBancario: QrBancarioPasarela,
  ) {
    this.registrar(stripe);
    this.registrar(wayra);
    this.registrar(manual);
    this.registrar(paypal);
    this.registrar(qrBancario);
  }

  private registrar(proveedor: IPasarelaProveedor): void {
    this.proveedores.set(proveedor.id, proveedor);
  }

  obtener(id: PasarelaId): IPasarelaProveedor {
    const prov = this.proveedores.get(id);
    if (!prov) {
      throw new PasarelaNoConfiguradaException(`Pasarela ${id} no registrada en el sistema.`);
    }
    return prov;
  }

  listar(filtro?: { contexto?: 'checkout' | 'suscripcion'; soloDisponibles?: boolean }): PasarelaMetadata[] {
    let proveedores = Array.from(this.proveedores.values());
    if (filtro?.contexto === 'checkout') {
      proveedores = proveedores.filter((p) => p.metadata.soportaCheckout);
    } else if (filtro?.contexto === 'suscripcion') {
      proveedores = proveedores.filter((p) => p.metadata.soportaSuscripcion);
    }
    if (filtro?.soloDisponibles) {
      proveedores = proveedores.filter((p) => p.metadata.estado === 'DISPONIBLE' && p.estaConfigurada());
    }
    return proveedores.map((p) => p.metadata);
  }

  asegurarDisponible(id: PasarelaId, contexto: 'checkout' | 'suscripcion'): IPasarelaProveedor {
    const prov = this.obtener(id);
    if (contexto === 'checkout' && !prov.metadata.soportaCheckout) {
      throw new PasarelaNoConfiguradaException(
        `La pasarela ${prov.metadata.nombre} no está habilitada para compras de tienda.`,
      );
    }
    if (contexto === 'suscripcion' && !prov.metadata.soportaSuscripcion) {
      throw new PasarelaNoConfiguradaException(
        `La pasarela ${prov.metadata.nombre} no está habilitada para pago de suscripciones.`,
      );
    }
    if (prov.metadata.estado !== 'DISPONIBLE' || !prov.estaConfigurada()) {
      throw new PasarelaNoConfiguradaException(
        `La pasarela ${prov.metadata.nombre} se encuentra en desarrollo.`,
      );
    }
    return prov;
  }
}
