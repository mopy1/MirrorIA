import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Firma HMAC-SHA256 del aviso de pago que manda el banco. Es el mismo esquema
 * que usan las pasarelas reales (Stripe, los QR interoperables): el banco firma
 * el cuerpo CRUDO con un secreto compartido y el comercio lo recalcula. Sin
 * esto, cualquiera que conozca la URL del aviso podria marcar ventas pagadas.
 */
export function firmarAviso(cuerpo: Buffer, secreto: string): string {
  return createHmac('sha256', secreto).update(cuerpo).digest('hex');
}

export function firmaAvisoValida(cuerpo: Buffer, firma: string, secreto: string): boolean {
  const esperada = Buffer.from(firmarAviso(cuerpo, secreto), 'hex');
  const recibida = Buffer.from(firma, 'hex');
  // timingSafeEqual exige el mismo largo; comparar largos no filtra el secreto.
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
}

/**
 * El secreto que comparten el banco y el comercio. Con WAYRA_SECRETO_AVISOS se
 * fija uno propio; si no, se deriva de JWT_SECRET para que la demo funcione sin
 * configurar nada nuevo (nunca se usa JWT_SECRET tal cual).
 */
export function secretoAvisosQr(config: { get<T = string>(clave: string): T | undefined }): string {
  const propio = config.get<string>('WAYRA_SECRETO_AVISOS');
  if (propio) return propio;
  const jwt = config.get<string>('JWT_SECRET');
  // En produccion, sin ningun secreto configurado, cualquiera que leyera este
  // repo podria firmar avisos falsos: mejor que el cobro por QR falle.
  if (!jwt && config.get<string>('NODE_ENV') === 'production') {
    throw new Error('Falta WAYRA_SECRETO_AVISOS o JWT_SECRET para firmar los avisos del QR');
  }
  const base = jwt ?? 'mirroria-dev';
  return createHmac('sha256', base).update('wayra-avisos-qr').digest('hex');
}
