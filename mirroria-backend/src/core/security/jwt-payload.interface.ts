export interface JwtPayload {
  sub: string; // usuario.id
  email: string;
  role: string;
  sucursalId: string | null;
  /** null solo para DUENO_PLATAFORMA. JwtStrategy lo relee de la BD (no confía en el token). */
  tenantId: string | null;
}
