import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

export interface AlternativasStock {
  otrasSucursales?: Array<{ sucursalId: string; sucursalNombre?: string; disponible: number }>;
  otrasTallas?: Array<{ varianteId: string; talla?: string; disponible: number }>;
}

export interface DetallesStockInsuficiente {
  varianteId: string;
  prendaNombre?: string;
  talla?: string;
  color?: string;
  sucursalId: string;
  sucursalNombre?: string;
  disponible: number;
  solicitado: number;
  alternativas?: AlternativasStock;
}

export class StockInsuficienteException extends BusinessException {
  readonly codigo = 'STOCK_AGOTADO_CONFLICTO';
  readonly detalles: DetallesStockInsuficiente;

  constructor(
    varianteId: string,
    sucursalId: string,
    disponible: number,
    solicitado: number,
    detallesExtra?: Partial<DetallesStockInsuficiente>,
  ) {
    const message =
      `Stock insuficiente para la variante ${varianteId} en la sucursal ${sucursalId}: ` +
      `disponible ${disponible}, solicitado ${solicitado}`;

    const detalles: DetallesStockInsuficiente = {
      varianteId,
      sucursalId,
      disponible,
      solicitado,
      ...detallesExtra,
    };

    super(
      {
        message,
        codigo: 'STOCK_AGOTADO_CONFLICTO',
        detalles,
      },
      HttpStatus.CONFLICT,
    );
    this.detalles = detalles;
  }
}
