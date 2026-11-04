const LARGO_MINIMO = 32;

/**
 * JWT_SECRET es obligatorio: sin fallback. Antes caía a un valor fijo que
 * estaba publicado en .env.example, y con él cualquiera podía firmar tokens
 * ADMIN. Si falta o es corto, el backend NO arranca (falla al construir el
 * JwtModule/JwtStrategy) con este mensaje.
 */
export function leerJwtSecret(config: { get<T = string>(clave: string): T | undefined }): string {
  const secreto = config.get<string>('JWT_SECRET')?.trim();
  if (!secreto || secreto.length < LARGO_MINIMO) {
    throw new Error(
      `JWT_SECRET falta o tiene menos de ${LARGO_MINIMO} caracteres. ` +
        'Generá uno con `openssl rand -hex 32` y ponelo en mirroria-backend/.env.',
    );
  }
  return secreto;
}
