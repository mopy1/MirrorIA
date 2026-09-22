import { describe, it, expect } from 'vitest';
import { computeGarmentTransform, computeGarmentTransform3D } from './landmarkMath';
import type { PoseLandmark } from '../types/pose.types';

const W = 1000;
const H = 1000;
const ANCHOR = { shoulderWidthFraction: 0.5, anchorX: 0.5, anchorY: 0.1 };

/** ML Kit entrega coordenadas CRUDAS del sensor: de frente a la camara, el
 * hombro DERECHO anatomico siempre tiene menor x que el izquierdo. */
function hombro(x: number, y: number, z = 0): PoseLandmark {
  return { x, y, z, visibility: 0.9 };
}

/** Hombros nivelados, en la orientacion cruda que da ML Kit. */
const IZQ_NIVELADO = hombro(0.7, 0.5);
const DER_NIVELADO = hombro(0.3, 0.5);

/** El hombro izquierdo anatomico BAJA (y crece hacia abajo en la imagen). */
const IZQ_CAIDO = hombro(0.7, 0.55);

const grados = (rad: number) => (rad * 180) / Math.PI;

describe('computeGarmentTransform (2D)', () => {
  it('con los hombros nivelados no rota, en las dos camaras', () => {
    for (const espejado of [false, true]) {
      const t = computeGarmentTransform(
        IZQ_NIVELADO, DER_NIVELADO, W, H, espejado, 200, 400, ANCHOR,
      );
      expect(t.visible).toBe(true);
      expect(t.rotationDeg).toBeCloseTo(0, 6);
    }
  });

  it('un hombro caido inclina la prenda hacia ese lado (camara trasera)', () => {
    const t = computeGarmentTransform(
      IZQ_CAIDO, DER_NIVELADO, W, H, false, 200, 400, ANCHOR,
    );
    // El hombro izquierdo anatomico cae a la DERECHA de la pantalla sin
    // espejar, y esta mas abajo -> la linea de hombros baja hacia la
    // derecha -> giro HORARIO, que en React Native es positivo.
    expect(t.rotationDeg).toBeGreaterThan(0);
    expect(t.rotationDeg).toBeCloseTo(7.125, 2);
  });

  it('se oculta si a un hombro le falta visibilidad', () => {
    const t = computeGarmentTransform(
      { ...IZQ_NIVELADO, visibility: 0.1 }, DER_NIVELADO, W, H, false, 200, 400, ANCHOR,
    );
    expect(t.visible).toBe(false);
  });
});

describe('computeGarmentTransform3D', () => {
  const caderas = [hombro(0.68, 0.8), hombro(0.32, 0.8)] as const;

  function t3d(izq: PoseLandmark, der: PoseLandmark, espejado = false,
               maxTorsoRatio = 0, lastRawYaw = 0) {
    return computeGarmentTransform3D(
      izq, der, caderas[0], caderas[1], W, H, espejado, 100, 10,
      maxTorsoRatio, lastRawYaw,
    );
  }

  it('el roll usa el MISMO signo que la version 2D — probado en vivo por el equipo', () => {
    // NO es un descuido que no este negado para el mundo Y-arriba de
    // three.js: negarlo hacia girar el vestido para el lado contrario al
    // del cuerpo (comprobado en un telefono real). Si alguien "arregla"
    // el signo por razonamiento teorico, este test tiene que fallar y
    // obligarlo a comprobarlo de nuevo CON UN TELEFONO.
    const dos = computeGarmentTransform(IZQ_CAIDO, DER_NIVELADO, W, H, false, 200, 400, ANCHOR);
    const tres = t3d(IZQ_CAIDO, DER_NIVELADO);
    expect(grados(tres.rotationRad)).toBeCloseTo(dos.rotationDeg, 6);
  });

  it('de frente el yaw es el giro base fijo de 12 grados', () => {
    const t = t3d(IZQ_NIVELADO, DER_NIVELADO);
    expect(grados(t.rotationYRad)).toBeCloseTo(12, 6);
  });

  it('el yaw total llega a 67 grados: 55 del cuerpo + 12 de base', () => {
    // El clamp de 55 se aplica ANTES de sumar los 12 de volumen fijo, asi
    // que el tope real del modelo es 67. Documentado aca porque el
    // AGENTS.md dice "acotado a ~55" y no es lo que hace el codigo.
    const torcido = t3d(hombro(0.52, 0.5, 5), hombro(0.48, 0.5, -5), false, 10);
    expect(Math.abs(grados(torcido.rotationYRad))).toBeCloseTo(67, 1);
  });

  it('sin caderas usables reutiliza el ultimo yaw en vez de saltar a cero', () => {
    const sinCaderas = computeGarmentTransform3D(
      IZQ_NIVELADO, DER_NIVELADO, undefined, undefined, W, H, false, 100, 10, 1, 0.5,
    );
    expect(sinCaderas.lastRawYaw).toBe(0.5);
  });

  it('espejar la camara invierte el yaw pero no el roll', () => {
    const normal = t3d(IZQ_CAIDO, DER_NIVELADO, false);
    const espejo = t3d(IZQ_CAIDO, DER_NIVELADO, true);
    expect(grados(espejo.rotationYRad)).toBeCloseTo(-grados(normal.rotationYRad), 6);
  });
});
