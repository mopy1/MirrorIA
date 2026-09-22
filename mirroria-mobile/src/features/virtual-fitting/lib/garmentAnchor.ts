import type { GarmentAnchor } from './landmarkMath';

/**
 * Convención fija que debe seguir cualquier PNG subido para el Vestidor AR
 * (campo `arOverlayImageUrl` del producto, cargado desde el panel admin
 * web): la línea de hombros de la prenda tiene que caer al 65% del ancho
 * de la imagen, centrada, a un 24% de la altura desde arriba — igual que
 * el PNG de prueba de la Fase 3. Sin este acuerdo no hay forma de saber
 * dónde ancla una imagen real sin pedirle metadata extra a quien la sube
 * (fuera del alcance de la Fase 4, ver plan).
 */
export const STANDARD_GARMENT_ANCHOR: GarmentAnchor = {
  shoulderWidthFraction: 0.65,
  anchorX: 0.5,
  anchorY: 0.24,
};
