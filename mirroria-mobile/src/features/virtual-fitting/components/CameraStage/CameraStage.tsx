import React, { useState } from 'react';
import {
  Modal,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';
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
import { useCameraPermission } from '../../hooks/useCameraPermission';
import { usePoseLandmarks } from '../../hooks/usePoseLandmarks';
import { useTimedCapture } from '../../hooks/useTimedCapture';
import { useRemoteGarmentSize } from '../../hooks/useRemoteGarmentSize';
import type { PoseLandmark } from '../../types/pose.types';
import { TEST_GARMENT } from '../../lib/testGarments';
import { STANDARD_GARMENT_ANCHOR } from '../../lib/garmentAnchor';
import type { GarmentAnchor } from '../../lib/landmarkMath';
import { CameraPermissionGate } from './CameraPermissionGate';
import { CameraControls } from './CameraControls';
import { CaptureControls } from './CaptureControls';
import { CountdownOverlay } from './CountdownOverlay';
import { PhotoReviewModal } from './PhotoReviewModal';
import { PoseOverlay } from '../PoseOverlay';
import { GarmentOverlay } from '../GarmentOverlay';

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

  const handleLayout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout);

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive
        resizeMode="cover"
        outputs={[frameOutput]}
        implementationMode="compatible"
      />
      {size.width > 0 && (
        <>
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
          <PoseOverlay
            landmarks={landmarks}
            processedFrames={processedFrames}
            mirrored={mirrored}
            containerWidth={size.width}
            containerHeight={size.height}
          />
        </>
      )}
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
 * prenda 2D que sigue el cuerpo (Fase 3, sprite de prueba — la selección
 * real de prenda vía `GarmentSelectorBar` queda para cuando exista el
 * pipeline de assets AR, ver Fase 4 del plan) y captura de foto con
 * temporizador para probar en autorretrato sin ayuda.
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
}

export function CameraStage({ arOverlayImageUrl }: CameraStageProps) {
  const insets = useSafeAreaInsets();
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();
  const [position, setPosition] = useState<'front' | 'back'>('front');
  const [isExpanded, setIsExpanded] = useState(false);
  const device = useCameraDevice(position);
  const { frameOutput, landmarks, processedFrames } = usePoseLandmarks();
  const remoteSize = useRemoteGarmentSize(arOverlayImageUrl);
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
