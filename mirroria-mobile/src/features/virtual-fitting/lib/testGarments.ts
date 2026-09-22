import type { GarmentAnchor } from './landmarkMath';
import { STANDARD_GARMENT_ANCHOR } from './garmentAnchor';

export interface TestGarment {
  source: number;
  imageWidth: number;
  imageHeight: number;
  anchor: GarmentAnchor;
}

/**
 * PNG de prueba hecho a mano para la Fase 3 (ver plan) — respaldo cuando el
 * producto seleccionado todavía no tiene `arOverlayImageUrl` cargado desde
 * el panel admin (Fase 4). `imageWidth`/`imageHeight` son el tamaño real
 * del archivo; sigue la misma convención de ancla que cualquier imagen
 * real (`STANDARD_GARMENT_ANCHOR`).
 */
export const TEST_GARMENT: TestGarment = {
  source: require('@/assets/images/ar-test-garments/shirt-wine.png'),
  imageWidth: 600,
  imageHeight: 700,
  anchor: STANDARD_GARMENT_ANCHOR,
};
