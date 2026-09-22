import React, { useEffect, useRef, useState } from 'react';
import { Buffer } from 'buffer';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Asset } from 'expo-asset';
import { useFrame } from '@react-three/fiber';
// Expo SDK 57 movió readAsStringAsync a la API "legacy" — el import normal
// de expo-file-system ya no la expone (API nueva basada en clases File/Directory).
import * as FileSystem from 'expo-file-system/legacy';
import type { SharedValue } from 'react-native-reanimated';
import { computeGarmentTransform3D } from '../../lib/landmarkMath';
import { POSE_LANDMARK_INDEX, type PoseLandmark } from '../../types/pose.types';

// React Native expone un `navigator` global (product: 'ReactNative'), pero
// sin `userAgent` — el constructor de GLTFLoader asume que es un string y
// llama `.match()` sobre él sin chequear, lo que tira
// "Cannot read property 'match' of undefined" antes de poder parsear nada.
// No es un bug nuestro, es GLTFLoader asumiendo un entorno de navegador.
// Se usa defineProperty (no asignación simple) por si algún otro polyfill ya
// dejó `userAgent` con un descriptor propio.
if (typeof navigator !== 'undefined' && !navigator.userAgent) {
  try {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'ReactNative',
      configurable: true,
      writable: true,
      enumerable: true,
    });
  } catch {
    // Si algún otro polyfill ya lo dejó no configurable, no hay nada más
    // que hacer acá — GLTFLoader fallará igual que antes.
  }
}

interface LoadedGarment {
  scene: THREE.Group;
  /** Ancho real (en unidades del propio glb) de la sección más ancha de la
   * mitad superior del modelo — la línea de hombros/mangas, en la práctica. */
  shoulderWidth: number;
  /** Altura Y de esa misma sección, relativa al origen del group (que está
   * centrado en el bounding box completo, ver más abajo). */
  shoulderY: number;
}

/** Qué tan cerca de la parte de arriba del modelo caen los hombros —
 * fracción de la altura total, medida desde arriba. Único número a ajustar
 * si la posición vertical queda mal con otro `.glb`; ver el porqué en
 * `measureShoulderCrossSection`. */
const SHOULDER_FRACTION_FROM_TOP = 0.08;

/**
 * Mide el ancho real del modelo (en sus propias unidades) a una altura fija
 * cerca de la parte de arriba — la línea de hombros/mangas, en la práctica.
 *
 * Antes esto buscaba la sección MÁS ANCHA de una franja amplia, pero en la
 * prueba real ese enfoque terminaba agarrando el busto o la cintura (casi
 * siempre más anchos que los hombros en cualquier vestido/remera con forma
 * de cuerpo) en vez de los hombros — el resultado se veía sistemáticamente
 * más arriba de lo esperado, porque todo lo que está por encima del punto
 * ancla (incluidos los hombros reales) terminaba flotando por encima del
 * punto detectado. Medir a una altura fija y cercana al borde de arriba es
 * más predecible y fácil de calibrar con un solo número.
 */
function measureShoulderCrossSection(scene: THREE.Group, box: THREE.Box3) {
  const totalHeight = box.max.y - box.min.y;
  const targetY = box.max.y - totalHeight * SHOULDER_FRACTION_FROM_TOP;
  // Franja angosta alrededor de esa altura — no un solo plano exacto, para
  // no depender de que haya vértices justo ahí.
  const bandHalfHeight = totalHeight * 0.03;

  let minX = Infinity;
  let maxX = -Infinity;
  const v = new THREE.Vector3();

  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const position = mesh.geometry?.attributes?.position;
    if (!position) return;

    for (let i = 0; i < position.count; i++) {
      v.set(position.getX(i), position.getY(i), position.getZ(i));
      mesh.localToWorld(v);
      if (Math.abs(v.y - targetY) > bandHalfHeight) continue;
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
    }
  });

  if (maxX === -Infinity) {
    // No se pudo medir nada a esa altura (geometría rara/hueca ahí) —
    // respaldo: ancho total del modelo.
    return { shoulderWidth: box.max.x - box.min.x, shoulderYWorld: targetY };
  }

  return { shoulderWidth: maxX - minX, shoulderYWorld: targetY };
}

/**
 * Three.js NO libera los recursos de GPU cuando el objeto de JS se
 * descarta: geometrías, materiales y texturas quedan vivos en el driver
 * hasta que alguien llama `dispose()`. Sin esto, cada vez que se alterna
 * "Vestido negro" / "Faja" se fuga la malla anterior entera.
 */
function liberarEscena(escena: THREE.Object3D) {
  escena.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materiales = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materiales) {
      if (!material) continue;
      for (const valor of Object.values(material) as unknown[]) {
        if (valor && (valor as THREE.Texture).isTexture) {
          (valor as THREE.Texture).dispose();
        }
      }
      material.dispose();
    }
  });
}

interface GarmentModelProps {
  /** Resultado de `require('...modelo.glb')`. */
  source: number;
  containerWidth: number;
  containerHeight: number;
  mirrored: boolean;
  landmarks: SharedValue<PoseLandmark[]>;
}

/**
 * Carga un `.glb`, lo centra en su propio origen una vez, mide dónde están
 * sus hombros reales, y en cada cuadro (`useFrame`, hilo de JS de
 * `@react-three/fiber`) reposiciona/escala/rota el group contenedor según
 * los hombros detectados — el equivalente 3D de `GarmentOverlay` +
 * `computeGarmentTransform` para el sprite 2D.
 */
export function GarmentModel({
  source,
  containerWidth,
  containerHeight,
  mirrored,
  landmarks,
}: GarmentModelProps) {
  const [loaded, setLoaded] = useState<LoadedGarment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const frameCountRef = useRef(0);
  // Suavizado (media móvil exponencial) entre cuadros: un cuadro de pose
  // basura (landmarks con ruido, o — visto en vivo con la cámara trasera de
  // este teléfono — un cuadro con resolución/orientación inconsistente por
  // el cambio automático entre lentes físicas) se nota como un salto
  // violento si se aplica directo; suavizarlo lo vuelve un parpadeo chico
  // en vez de un giro/escala absurdos por un instante.
  const smoothedRef = useRef({
    visible: false,
    x: 0,
    y: 0,
    scale: 1,
    rotationRad: 0,
    rotationYRad: 0,
  });
  // Calibración adaptativa del yaw (ver `computeGarmentTransform3D`) — la
  // "razón ancho/alto de frente" observada hasta ahora, memoria pura entre
  // cuadros, sin efecto visual directo.
  const maxTorsoRatioRef = useRef(0);
  const lastRawYawRef = useRef(0);
  const invisibleStreakRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const asset = Asset.fromModule(source);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;

        // GLTFLoader.load() usa un FileLoader propio que importa desde el
        // código fuente de three (no desde el `require('three')` que
        // @react-three/fiber parcha para leer archivos vía expo-file-system)
        // — dos instancias de la misma clase, el parche nunca lo alcanza, y
        // termina usando FileReader/ProgressEvent (APIs de navegador que no
        // existen en RN). Se evita del todo leyendo el archivo nosotros
        // mismos y pasándole los bytes crudos a `.parse()`, que no depende
        // de ningún FileLoader.
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const arrayBuffer = Buffer.from(base64, 'base64').buffer;

        new GLTFLoader().parse(
          arrayBuffer,
          '',
          (gltf) => {
            // Si el efecto ya se limpió (cambio de prenda o desmontaje),
            // esta escena no la va a usar nadie: liberarla acá o se fuga.
            if (cancelled) {
              liberarEscena(gltf.scene);
              return;
            }

            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = new THREE.Vector3();
            box.getCenter(center);

            const { shoulderWidth, shoulderYWorld } = measureShoulderCrossSection(
              gltf.scene,
              box,
            );

            // Centrar el modelo en su propio origen (0,0,0) — así, el
            // group que lo envuelve puede moverlo/escalarlo/rotarlo entero
            // cada cuadro sin offsets raros del pivote original del glb.
            // `shoulderY` se mide ANTES de este corrimiento (en espacio de
            // mundo), así que hay que restarle `center.y` para que quede
            // relativo al mismo origen que el group usa después.
            gltf.scene.position.sub(center);

            setLoaded({
              scene: gltf.scene,
              shoulderWidth,
              shoulderY: shoulderYWorld - center.y,
            });
          },
          (err) => {
            if (!cancelled) {
              setError(err instanceof Error ? err.message : String(err));
            }
          },
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(() => {
    const escena = loaded?.scene;
    if (!escena) return;
    return () => liberarEscena(escena);
  }, [loaded]);

  useEffect(() => {
    if (error) console.error('[GarmentModel] error cargando glb:', error);
  }, [error]);

  useFrame(() => {
    if (!groupRef.current || !loaded) return;

    const left = landmarks.value[POSE_LANDMARK_INDEX.LEFT_SHOULDER];
    const right = landmarks.value[POSE_LANDMARK_INDEX.RIGHT_SHOULDER];
    const leftHip = landmarks.value[POSE_LANDMARK_INDEX.LEFT_HIP];
    const rightHip = landmarks.value[POSE_LANDMARK_INDEX.RIGHT_HIP];
    const t = computeGarmentTransform3D(
      left,
      right,
      leftHip,
      rightHip,
      containerWidth,
      containerHeight,
      mirrored,
      loaded.shoulderWidth,
      loaded.shoulderY,
      maxTorsoRatioRef.current,
      lastRawYawRef.current,
    );
    maxTorsoRatioRef.current = t.maxTorsoRatio;
    lastRawYawRef.current = t.lastRawYaw;

    frameCountRef.current += 1;
    if (frameCountRef.current % 20 === 0) {
      console.log('[GarmentModel] transform:', {
        visible: t.visible,
        rotationYDeg: ((t.rotationYRad * 180) / Math.PI).toFixed(1),
        maxTorsoRatio: t.maxTorsoRatio.toFixed(3),
      });
    }

    const s = smoothedRef.current;

    if (!t.visible) {
      // No ocultar de golpe con UN cuadro sin hombros — en la prueba real
      // la detección parpadea seguido (un cuadro sí, uno no), y ocultar
      // cada vez se veía como un parpadeo constante. Unos cuantos cuadros
      // seguidos sin cuerpo (~0.3s a 20-30fps) recién ahí se oculta.
      invisibleStreakRef.current += 1;
      if (invisibleStreakRef.current > 8) {
        s.visible = false;
        groupRef.current.visible = false;
      }
      return;
    }
    invisibleStreakRef.current = 0;

    // Al volver a aparecer (estaba oculto), saltar directo al valor nuevo
    // en vez de arrastrar desde el último valor viejo/0 — si no, el primer
    // cuadro visible siempre se ve "llegando desde otro lado".
    const SMOOTHING = 0.25;
    const blend = s.visible ? SMOOTHING : 1;
    // El yaw geométrico (hombro/cadera) salió mucho más ruidoso que el
    // resto en la prueba real (saltos de -60° a +30° entre cuadros
    // consecutivos) — necesita mucho más suavizado que la posición/escala
    // para no sentirse como "2 fotos alternándose".
    const YAW_SMOOTHING = 0.06;
    const yawBlend = s.visible ? YAW_SMOOTHING : 1;
    s.x += (t.x - s.x) * blend;
    s.y += (t.y - s.y) * blend;
    s.scale += (t.scale - s.scale) * blend;

    // El giro plano (roll) salta ~180° de rato en rato en vivo — ML Kit
    // confunde por un instante cuál hombro es cuál (izquierda/derecha), lo
    // que invierte el signo de la resta y manda el ángulo al otro extremo.
    // Un tilt real de la persona nunca cambia tan rápido, así que un salto
    // grande de un cuadro a otro se trata como ruido: se ignora (se
    // mantiene el valor suavizado) en vez de arrastrarse hacia él.
    const angleDiff = (a: number, b: number) => {
      let d = a - b;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      return d;
    };
    const rollDiff = angleDiff(t.rotationRad, s.rotationRad);
    const rollBlend = s.visible && Math.abs(rollDiff) > (Math.PI * 100) / 180 ? 0 : blend;
    s.rotationRad += rollDiff * rollBlend;
    s.rotationYRad += (t.rotationYRad - s.rotationYRad) * yawBlend;
    s.visible = true;

    groupRef.current.visible = true;
    groupRef.current.position.set(s.x, s.y, 0);
    groupRef.current.scale.setScalar(s.scale);
    groupRef.current.rotation.z = s.rotationRad;
    groupRef.current.rotation.y = s.rotationYRad;
  });

  if (!loaded) return null;
  return (
    <group ref={groupRef} visible={false}>
      <primitive object={loaded.scene} />
    </group>
  );
}
