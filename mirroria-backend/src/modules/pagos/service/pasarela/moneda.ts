import type { ConfigService } from '@nestjs/config';

/** Tipo de cambio oficial del boliviano, fijo desde 2011. */
const TIPO_CAMBIO_OFICIAL = 6.96;

export function tipoCambioBobUsd(config: ConfigService): number {
  const configurado = Number(config.get<string>('TIPO_CAMBIO_BOB_USD'));
  return configurado > 0 ? configurado : TIPO_CAMBIO_OFICIAL;
}

export function centavosBobAUsd(centavosBob: number, tipoCambio: number): number {
  return Math.round(centavosBob / tipoCambio);
}
