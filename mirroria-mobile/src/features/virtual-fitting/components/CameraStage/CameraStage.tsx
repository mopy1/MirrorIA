import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';
import { Box, Shirt, Shuffle } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  type CameraDevice,
  type CameraFrameOutput,
} from 'react-native-vision-camera';
import type { SharedValue } from 'react-native-reanimated';
import { captureScreen } from 'react-native-view-shot';
import { Text } from '@/components/ui/text';
import { useCameraActive } from '../../hooks/useCameraActive';
import { useCameraPermission } from '../../hooks/useCameraPermission';
import { usePoseLandmarks } from '../../hooks/usePoseLandmarks';
import { useTimedCapture } from '../../hooks/useTimedCapture';
import { useRemoteGarmentSize } from '../../hooks/useRemoteGarmentSize';
import type { PoseLandmark } from '../../types/pose.types';
import { TEST_GARMENT } from '../../lib/testGarments';
import { STANDARD_GARMENT_ANCHOR } from '../../lib/garmentAnchor';
import type { GarmentAnchor } from '../../lib/landmarkMath';
import { resolverFuenteModelo, type FuenteModelo } from '../../lib/fuenteModelo';
import { CameraPermissionGate } from './CameraPermissionGate';
import { CameraControls } from './CameraControls';
import { CaptureControls } from './CaptureControls';
import { CountdownOverlay } from './CountdownOverlay';
import { PhotoReviewModal } from './PhotoReviewModal';
import { PoseOverlay } from '../PoseOverlay';
import { GarmentOverlay } from '../GarmentOverlay';
import { GarmentScene3D } from '../GarmentScene3D';

/** Modelos 3D de prueba de la Fase 5 (ver plan), ambos CC-BY-4.0 vía
 * Sketchfab: "Black Dress" de ZahraAmini
 * (https://sketchfab.com/3d-models/black-dress-6fcc25c69a754ab09ab08d75cce06279)
 * y "Waist Trainer" de Dragonflyrenders
 * (https://sketchfab.com/3d-models/waist-trainer-90e10e9b9d474cc58aa7c8af99658299).
 * Reemplazan temporalmente al sprite 2D de la Fase 3 para probar el motor
 * 3D — la selección real de prenda por producto queda para cuando exista
 * el pipeline de assets `.glb` reales (ver Fase 4/roadmap del plan). */
const TEST_GARMENTS_3D = [
  { name: 'Vestido negro', source: require('../../../../../assets/models/black_dress.glb') },
  { name: 'Faja', source: require('../../../../../assets/models/waist_trainer.glb') },
];

interface GarmentSource {
  source: ImageSourcePropType;
  imageWidth: number;
  imageHeight: number;
  anchor: GarmentAnchor;
}

interface CameraSurfaceContentProps {
  device: CameraDevice;
  frameOutput: CameraFrameOutput;
  garment: GarmentSource;
  use3D: boolean;
  onToggle3D: () => void;
  garment3DName: string;
  garment3DFuente: FuenteModelo;
  onCycleGarment3D: () => void;
  landmarks: SharedValue<PoseLandmark[]>;
  processedFrames: SharedValue<number>;
  mirrored: boolean;
  isExpanded: boolean;
  onFlip: () => void;
  onToggleExpand: () => void;
  timerSeconds: number;
  onCycleTimer: () => void;
  onCapture: () => void;
  isCapturing: boolean;
  countdown: number | null;
  topOffset: number;
  bottomOffset: number;
}

/** Todo lo que se dibuja sobre la cámara — igual en modo tarjeta y modo
 * pantalla completa, solo cambia el contenedor externo y los offsets. Mide
 * su propio tamaño una vez (`onLayout`) y se lo pasa a `PoseOverlay` y
 * `GarmentOverlay`, para que los dos usen el mismo marco de referencia de
 * píxeles. La foto se saca con `captureScreen()` (pantalla completa), no
 * apuntando a esta vista puntual — ver el porqué en `CameraStage`. */
function CameraSurfaceContent({
  device,
  frameOutput,
  garment,
  use3D,
  onToggle3D,
  garment3DName,
  garment3DFuente,
  onCycleGarment3D,
  landmarks,
  processedFrames,
  mirrored,
  isExpanded,
  onFlip,
  onToggleExpand,
  timerSeconds,
  onCycleTimer,
  onCapture,
  isCapturing,
  countdown,
  topOffset,
  bottomOffset,
}: CameraSurfaceContentProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  // La cámara solo prende con la pestaña en foco y la app en primer plano
  // — ver `useCameraActive`.
  const activa = useCameraActive();

  const handleLayout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout);

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={activa}
        resizeMode="cover"
        outputs={[frameOutput]}
        implementationMode="compatible"
      />
      {size.width > 0 && (
        <>
          {use3D ? (
            <GarmentScene3D
              fuente={garment3DFuente}
              containerWidth={size.width}
              containerHeight={size.height}
              mirrored={mirrored}
              landmarks={landmarks}
            />
          ) : (
            <GarmentOverlay
              landmarks={landmarks}
              containerWidth={size.width}
              containerHeight={size.height}
              mirrored={mirrored}
              source={garment.source}
              imageWidth={garment.imageWidth}
              imageHeight={garment.imageHeight}
              anchor={garment.anchor}
            />
          )}
          <PoseOverlay
            landmarks={landmarks}
            processedFrames={processedFrames}
            mirrored={mirrored}
            containerWidth={size.width}
            containerHeight={size.height}
          />
        </>
      )}
      <View style={{ top: topOffset }} className="absolute left-3 gap-2">
        <Pressable
          onPress={onToggle3D}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50"
        >
          <Icon as={use3D ? Box : Shirt} size={14} className="text-white" />
          <Text className="text-[10px] font-semibold text-white">
            {use3D ? '3D (prueba)' : '2D'}
          </Text>
        </Pressable>
        {use3D && (
          <Pressable
            onPress={onCycleGarment3D}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50"
          >
            <Icon as={Shuffle} size={14} className="text-white" />
            <Text className="text-[10px] font-semibold text-white">{garment3DName}</Text>
          </Pressable>
        )}
      </View>
      <CameraControls
        isExpanded={isExpanded}
        onFlip={onFlip}
        onToggleExpand={onToggleExpand}
        topOffset={topOffset}
      />
      <CaptureControls
        timerSeconds={timerSeconds}
        onCycleTimer={onCycleTimer}
        onCapture={onCapture}
        isCapturing={isCapturing}
        bottomOffset={bottomOffset}
      />
      {countdown !== null && <CountdownOverlay value={countdown} />}
    </View>
  );
}

/**
 * Cámara en vivo del Vestidor 3D. Frontal por defecto (probador en primera
 * persona), con flip, pantalla completa, puntos de pose (Fase 2), una
 * prenda 2D que sigue el cuerpo y captura de foto con temporizador para
 * probar en autorretrato sin ayuda.
 *
 * La prenda elegida en `GarmentSelectorBar` manda: su `arOverlayImageUrl`
 * alimenta el sprite 2D y su `modeloArUrl` el visor 3D. Los modelos de
 * prueba empaquetados quedan solo como respaldo para productos que todavía
 * no tienen `.glb` cargado.
 *
 * La foto se saca con `captureScreen()` (pantalla completa), no con
 * `ViewShot` apuntando a la cámara: ninguno de los dos métodos logra
 * incluir lo que se dibuja encima del preview (ni los puntos, ni los
 * controles) — es una limitación conocida de Android/CameraX: el preview
 * es una capa de video compuesta por hardware aparte del resto de la UI, y
 * ninguna herramienta de captura basada en la vista/pantalla puede agarrar
 * las dos capas juntas en una sola llamada. Queda documentado como
 * pendiente (ver conversación) — la solución real es capturar cámara y
 * overlay por separado y componerlas en código, no un ajuste rápido.
 */
interface CameraStageProps {
  /** URL real cargada desde el panel admin (Fase 4). Si es `null`/no hay
   * producto seleccionado, o mientras se mide su tamaño real, se usa el
   * PNG de prueba de la Fase 3 como respaldo — nunca se deja sin prenda. */
  arOverlayImageUrl?: string | null;
  /** `modeloArUrl` del producto elegido — el `.glb` que carga el visor 3D.
   * Si no hay, o no es un glb usable, se cae a los modelos de prueba
   * empaquetados (ver `resolverFuenteModelo`). */
  modeloArUrl?: string | null;
}

export function CameraStage({ arOverlayImageUrl, modeloArUrl }: CameraStageProps) {
  const insets = useSafeAreaInsets();
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();
  const [position, setPosition] = useState<'front' | 'back'>('front');
  const [isExpanded, setIsExpanded] = useState(false);
  // Fase 5 en construcción: arranca en 3D a propósito para poder probarlo
  // apenas se abre la pantalla, con el sprite 2D de la Fase 3 a un toque.
  const [use3D, setUse3D] = useState(true);
  const [garment3DIndex, setGarment3DIndex] = useState(0);
  const device = useCameraDevice(position);
  const { frameOutput, landmarks, processedFrames } = usePoseLandmarks();
  const remoteSize = useRemoteGarmentSize(arOverlayImageUrl);
  // El `.glb` del producto elegido gana; si no tiene (o la URL no sirve) se
  // sigue usando el modelo de prueba que el botón de ciclado deja a mano.
  const fuente3D = resolverFuenteModelo(
    modeloArUrl,
    TEST_GARMENTS_3D[garment3DIndex].source,
  );
  const garment: GarmentSource =
    arOverlayImageUrl && remoteSize
      ? {
          source: { uri: arOverlayImageUrl },
          imageWidth: remoteSize.width,
          imageHeight: remoteSize.height,
          anchor: STANDARD_GARMENT_ANCHOR,
        }
      : TEST_GARMENT;
  const {
    timerSeconds,
    cycleTimer,
    countdown,
    isCapturing,
    capture,
    photoPath,
    closeReview,
  } = useTimedCapture(() => captureScreen({ format: 'jpg', quality: 0.9 }));

  if (!hasPermission) {
    return (
      <CameraPermissionGate
        canRequestPermission={canRequestPermission}
        onRequestPermission={requestPermission}
      />
    );
  }

  if (!device) {
    return (
      <View
        style={{ minHeight: 420 }}
        className="items-center justify-center rounded-3xl bg-card border border-border/80 p-6"
      >
        <Text className="text-xs text-center text-muted-foreground">
          No se encontró una cámara {position === 'front' ? 'frontal' : 'trasera'}{' '}
          en este dispositivo.
        </Text>
      </View>
    );
  }

  const flipCamera = () => setPosition((p) => (p === 'front' ? 'back' : 'front'));

  const surfaceProps = {
    device,
    frameOutput,
    garment,
    use3D,
    onToggle3D: () => setUse3D((v) => !v),
    garment3DName: fuente3D.tipo === 'remoto'
      ? 'Modelo del producto'
      : TEST_GARMENTS_3D[garment3DIndex].name,
    garment3DFuente: fuente3D,
    onCycleGarment3D: () =>
      setGarment3DIndex((i) => (i + 1) % TEST_GARMENTS_3D.length),
    landmarks,
    processedFrames,
    mirrored: position === 'front',
    onFlip: flipCamera,
    timerSeconds,
    onCycleTimer: cycleTimer,
    onCapture: capture,
    isCapturing,
    countdown,
  };

  return (
    <>
      {isExpanded ? (
        <Modal
          visible
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setIsExpanded(false)}
        >
          <View className="flex-1 bg-black">
            <CameraSurfaceContent
              {...surfaceProps}
              isExpanded
              onToggleExpand={() => setIsExpanded(false)}
              topOffset={insets.top + 12}
              bottomOffset={insets.bottom + 16}
            />
          </View>
        </Modal>
      ) : (
        <View
          style={{ minHeight: 420 }}
          className="rounded-3xl overflow-hidden relative bg-black"
        >
          <CameraSurfaceContent
            {...surfaceProps}
            isExpanded={false}
            onToggleExpand={() => setIsExpanded(true)}
            topOffset={12}
            bottomOffset={16}
          />
        </View>
      )}

      <PhotoReviewModal photoPath={photoPath} onClose={closeReview} />
    </>
  );
}
