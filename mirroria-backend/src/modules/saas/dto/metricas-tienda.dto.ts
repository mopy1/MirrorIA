/** Solo agregados de UNA tienda (privacidad D7: agregados sí, filas nunca). */
export class MetricasTiendaDto {
  ventasMes!: { cantidad: number; montoCents: number };
  ventasMesAnterior!: { cantidad: number; montoCents: number };
  /** montoCents / cantidad del mes (0 si no hay). */
  ticketPromedioCents!: number;
  productosActivos!: number;
  usuariosStaff!: number;
  clientas!: number;
  sucursalesActivas!: number;
  reservasMes!: number;
  ultimaVentaAt!: string | null;
  /** 30 días (hora de La Paz), con ceros. */
  ventasPorDia!: { fecha: string; cantidad: number; montoCents: number }[];
}
