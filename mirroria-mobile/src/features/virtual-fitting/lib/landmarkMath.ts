import type { PoseLandmark } from '../types/pose.types';
import { MIN_VISIBILITY } from '../types/pose.types';

/** Describe, para una imagen de prenda dada, qué punto suyo corresponde al
 * punto medio real de hombros y qué ancho suyo corresponde al ancho real de
 * hombros — así el mismo código sirve para cualquier PNG sin hardcodear
 * proporciones por prenda. Todo en fracciones 0-1 del tamaño de la imagen. */
export interface GarmentAnchor {
  shoulderWidthFraction: number;
  anchorX: number;
  anchorY: number;
}

export interface GarmentTransform {
  visible: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
  rotationDeg: number;
}

/**
 * Ancho de hombros → escala, punto medio de hombros → posición, ángulo de
 * la línea de hombros → rotación. Pura y marcada `'worklet'` a propósito:
 * se llama desde dentro de un `useAnimatedStyle` (hilo de UI), no desde
 * React — por eso recibe los dos landmarks ya resueltos en vez de todo el
 * array + un índice.
 */
export function computeGarmentTransform(
  leftShoulder: PoseLandmark | undefined,
  rightShoulder: PoseLandmark | undefined,
  containerWidth: number,
  containerHeight: number,
  mirrored: boolean,
  imageWidth: number,
  imageHeight: number,
  anchor: GarmentAnchor,
): GarmentTransform {
  'worklet';
  const hidden: GarmentTransform = {
    visible: false,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    rotationDeg: 0,
  };

  if (!leftShoulder || !rightShoulder) return hidden;
  if (
    leftShoulder.visibility < MIN_VISIBILITY ||
    rightShoulder.visibility < MIN_VISIBILITY
  ) {
    return hidden;
  }

  // Mismo criterio que PoseDot: el frame crudo no está espejado, pero el
  // preview de la cámara frontal sí — se espeja acá para que la prenda
  // caiga en el mismo lugar que ve la clienta en pantalla.
  const leftX = (mirrored ? 1 - leftShoulder.x : leftShoulder.x) * containerWidth;
  const rightX = (mirrored ? 1 - rightShoulder.x : rightShoulder.x) * containerWidth;
  const leftY = leftShoulder.y * containerHeight;
  const rightY = rightShoulder.y * containerHeight;

  const shoulderWidthPx = Math.hypot(rightX - leftX, rightY - leftY);
  const midX = (leftX + rightX) / 2;
  const midY = (leftY + rightY) / 2;

  const scale = shoulderWidthPx / (imageWidth * anchor.shoulderWidthFraction);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  const left = midX - anchor.anchorX * width;
  const top = midY - anchor.anchorY * height;

  // ML Kit siempre da los landmarks en coordenadas CRUDAS del sensor (sin
  // espejar) — de frente a la cámara, el hombro derecho anatómico SIEMPRE
  // tiene menor x cruda que el izquierdo, sea cámara frontal o trasera.
  // Con `mirrored` (frontal) invertimos x arriba para que la posición se
  // vea en espejo — eso además invierte el orden izquierda/derecha en
  // pantalla, y por eso hace falta este -180° extra para que "nivelado" dé
  // ~0°. Sin espejar (trasera), el orden crudo ya es el normal de una foto
  // sin espejo, así que NO hace falta el -180° — aplicarlo ahí (como
  // pasaba antes) deja el vestido prácticamente al revés incluso con los
  // hombros nivelados (confirmado en vivo: rotationDeg ≈ -175° con la
  // trasera en una pose normal).
  const rotationRad = Math.atan2(leftY - rightY, leftX - rightX) - (mirrored ? Math.PI : 0);
  const rotationDeg = (rotationRad * 180) / Math.PI;

  return { visible: true, left, top, width, height, rotationDeg };
}

export interface GarmentTransform3D {
  visible: boolean;
  x: number;
  y: number;
  scale: number;
  rotationRad: number;
  /** Giro alrededor del eje vertical (yaw) — lo que le da sensación de 3D
   * real al girar el torso, no solo el giro plano de `rotationRad`. */
  rotationYRad: number;
  /** Estado de calibración adaptativa del yaw — pasar de vuelta en la
   * siguiente llamada (ver `maxTorsoRatio` más abajo). No es parte visual
   * del resultado, es solo memoria entre cuadros para una función pura. */
  maxTorsoRatio: number;
  /** Último yaw geométrico válido (sin el giro base ni el signo de
   * espejado) — memoria para cuando las caderas desaparecen un instante,
   * ver el porqué en `computeGarmentTransform3D`. */
  lastRawYaw: number;
}

/** Cuánto puede girar el modelo sobre el eje vertical (yaw) al voltear el
 * torso — acotado a propósito (ver `computeGarmentTransform3D`). No es 90°
 * (perfil completo) a propósito: ahí el vestido se ve casi de canto, y con
 * una malla con pliegues eso se ve raro (confirmado en vivo — parecía una
 * flor girando). */
const MAX_YAW_RAD = (55 * Math.PI) / 180;

/** Giro fijo que se suma siempre, para que de frente el modelo se vea en
 * 3/4 y no completamente plano de frente (como un PNG). */
const BASE_YAW_RAD = (12 * Math.PI) / 180;

/**
 * Versión 3D de `computeGarmentTransform`: en vez de un rect de pantalla
 * (left/top/width/height en px), devuelve la posición/escala/rotación de un
 * `THREE.Group` en el mundo de la cámara ortográfica (1 unidad = 1px,
 * origen en el centro, Y hacia arriba — al revés que la pantalla). No lleva
 * `'worklet'`: se llama desde `useFrame` de `@react-three/fiber`, que corre
 * en el hilo de JS (no en el hilo de UI de Reanimated), así que leer
 * `landmarks.value` ahí es la forma normal, no la optimizada con worklets.
 *
 * `shoulderWidth`/`shoulderY` no son fracciones adivinadas: se miden una
 * sola vez al cargar el `.glb`, buscando el punto más ancho de la mitad
 * superior de su geometría real (ver `findShoulderCrossSection` en
 * `GarmentModel.tsx`) — así sirve para cualquier modelo sin calibrar a
 * mano por prenda.
 */
export function computeGarmentTransform3D(
  leftShoulder: PoseLandmark | undefined,
  rightShoulder: PoseLandmark | undefined,
  leftHip: PoseLandmark | undefined,
  rightHip: PoseLandmark | undefined,
  containerWidth: number,
  containerHeight: number,
  mirrored: boolean,
  shoulderWidth: number,
  shoulderY: number,
  maxTorsoRatio: number,
  lastRawYaw: number,
): GarmentTransform3D {
  const hidden: GarmentTransform3D = {
    visible: false,
    x: 0,
    y: 0,
    scale: 1,
    rotationRad: 0,
    rotationYRad: 0,
    maxTorsoRatio,
    lastRawYaw,
  };

  if (!leftShoulder || !rightShoulder) return hidden;
  if (
    leftShoulder.visibility < MIN_VISIBILITY ||
    rightShoulder.visibility < MIN_VISIBILITY
  ) {
    return hidden;
  }

  const leftX = (mirrored ? 1 - leftShoulder.x : leftShoulder.x) * containerWidth;
  const rightX = (mirrored ? 1 - rightShoulder.x : rightShoulder.x) * containerWidth;
  const leftY = leftShoulder.y * containerHeight;
  const rightY = rightShoulder.y * containerHeight;

  const shoulderWidthPx = Math.hypot(rightX - leftX, rightY - leftY);
  const midXScreen = (leftX + rightX) / 2;
  const midYScreen = (leftY + rightY) / 2;

  const scale = shoulderWidth > 0 ? shoulderWidthPx / shoulderWidth : 1;

  // Pantalla: origen arriba-izquierda, Y crece hacia abajo.
  // Mundo (cámara ortográfica): origen en el centro, Y crece hacia arriba.
  const worldX = midXScreen - containerWidth / 2;
  // El group está centrado en el origen del bounding box (ver GarmentModel)
  // — `shoulderY` es dónde caen los hombros REALES relativo a ese origen,
  // medido en la geometría, así que hay que restar ese offset (ya
  // escalado) para que el punto de hombros del modelo caiga exactamente
  // en el punto de hombros detectado, no el centro geométrico del modelo.
  const worldY = -(midYScreen - containerHeight / 2) - shoulderY * scale;

  // Mismo atan2 que la versión 2D, con el mismo -180° condicional a
  // `mirrored` (ver el comentario largo en `computeGarmentTransform`): sin
  // eso, con la cámara trasera el vestido quedaba prácticamente al revés
  // (~175°) incluso con los hombros nivelados — confirmado en vivo con
  // logs reales. La negación que tenía antes (por "invertir el eje Y al
  // pasar a mundo") también resultó estar mal en la práctica — al
  // inclinarse hacia un lado, el vestido giraba para el lado contrario
  // (confirmado en vivo) — así que va sin negar.
  const rotationRad = Math.atan2(leftY - rightY, leftX - rightX) - (mirrored ? Math.PI : 0);

  // Yaw (giro sobre el eje vertical): la primera versión usaba `z`
  // (profundidad que da ML Kit) igual que `x` para un atan2, pero en la
  // práctica esa `z` resultó tener una escala mucho más grande e
  // impredecible que `x` — el atan2 se saturaba en ±90° con cualquier
  // ruido, y hasta amortiguándolo directo se sentía como "2 fotos que se
  // alternan" en vez de un giro proporcional de verdad (confirmado en
  // vivo). La magnitud del giro ahora sale de algo geométrico y estable:
  // el ANCHO de hombros se acorta al girar el torso (escorzo), pero el
  // ALTO hombro-cadera casi no cambia (es un giro sobre el eje vertical,
  // no se acorta verticalmente) — la razón ancho/alto cae de forma suave y
  // predecible con el ángulo real de giro, sin depender de la escala
  // rara de `z`. Sigue usándose el SIGNO de `z` nomás (para saber hacia
  // qué lado se giró) porque el signo es mucho más confiable que su
  // magnitud.
  // Empieza en el último valor conocido (no en 0): si las caderas
  // desaparecen un instante (brazos extendidos tapándolas, encuadre
  // cerrado, un cuadro ruidoso) y no se actualiza, el giro se queda
  // quieto donde estaba en vez de saltar de golpe al giro base — visto en
  // vivo, ese salto se sentía como que la prenda "cambiaba a cada rato".
  let rawYaw = lastRawYaw;
  let newMaxTorsoRatio = maxTorsoRatio;

  const hipsUsable =
    !!leftHip &&
    !!rightHip &&
    leftHip.visibility >= MIN_VISIBILITY &&
    rightHip.visibility >= MIN_VISIBILITY;

  if (hipsUsable) {
    const leftHipX = (mirrored ? 1 - leftHip.x : leftHip.x) * containerWidth;
    const rightHipX = (mirrored ? 1 - rightHip.x : rightHip.x) * containerWidth;
    const leftHipY = leftHip.y * containerHeight;
    const rightHipY = rightHip.y * containerHeight;
    const midHipX = (leftHipX + rightHipX) / 2;
    const midHipY = (leftHipY + rightHipY) / 2;

    const torsoHeightPx = Math.hypot(midHipX - midXScreen, midHipY - midYScreen);
    const currentRatio = torsoHeightPx > 0 ? shoulderWidthPx / torsoHeightPx : 0;

    // Calibración adaptativa: no sabemos de antemano la proporción
    // ancho/alto "de frente" de ESTA persona — se asume que el valor más
    // grande visto hasta ahora es de frente (uno se termina parando de
    // frente en algún momento al usar la app), con una decadencia lenta
    // para poder corregirse solo si esa primera lectura fue ruido. Un
    // cuadro puntualmente ruidoso (caderas mal ubicadas por un instante)
    // no debería poder disparar el máximo de golpe — como mucho 50% más
    // que lo ya visto por cuadro, así un outlier no corrompe la
    // calibración de una sola vez.
    if (currentRatio > newMaxTorsoRatio) {
      newMaxTorsoRatio = Math.min(currentRatio, newMaxTorsoRatio * 1.5 || currentRatio);
    } else {
      newMaxTorsoRatio *= 0.999;
    }

    if (newMaxTorsoRatio > 0.05) {
      const cosYaw = Math.min(1, Math.max(0, currentRatio / newMaxTorsoRatio));
      const magnitude = Math.acos(cosYaw); // 0 (de frente) a ~90° (de perfil)
      // Signo probado en vivo y confirmado al revés — el vestido giraba
      // para el lado contrario al que la persona miraba/giraba.
      const sign = rightShoulder.z - leftShoulder.z >= 0 ? -1 : 1;
      rawYaw = magnitude * sign;
    }
  }
  // Si las caderas no se pueden usar, `rawYaw` queda como estaba
  // (`lastRawYaw`) — no se intenta adivinar nada nuevo sin datos.

  let rotationYRad = Math.max(-MAX_YAW_RAD, Math.min(MAX_YAW_RAD, rawYaw));

  // De frente perfecto el modelo quedaba totalmente plano, como un sprite
  // 2D — se suma un giro base fijo para que siempre se note algo de
  // volumen 3D, incluso sin girar el torso.
  rotationYRad += BASE_YAW_RAD;

  if (mirrored) rotationYRad = -rotationYRad;

  return {
    visible: true,
    x: worldX,
    y: worldY,
    scale,
    rotationRad,
    rotationYRad,
    maxTorsoRatio: newMaxTorsoRatio,
    lastRawYaw: rawYaw,
  };
}
