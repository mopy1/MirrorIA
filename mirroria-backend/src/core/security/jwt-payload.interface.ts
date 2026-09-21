export interface JwtPayload {
  sub: string; // usuario.id
  email: string;
  role: string;
  sucursalId: string | null;
}
