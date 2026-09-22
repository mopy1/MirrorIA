import VisionCamera
import NitroModules

/**
 * Implementación de iOS: deliberadamente vacía.
 *
 * El probador AR es Android-first por decisión explícita del equipo — la
 * detección de pose real vive en `android/.../MirroriaPoseDetector.kt`
 * (ML Kit). Este archivo NO es "código pendiente": existe para que el
 * módulo COMPILE en iOS, porque nitrogen genera
 * `HybridMirroriaPoseDetectorSpec` como un protocolo con miembros
 * obligatorios y cualquier build de iOS falla si no están todos.
 *
 * Antes acá quedó el template sin tocar de `create-react-native-library`,
 * con un `multiply(a:b:)` que ya no existe en el spec y ninguno de los tres
 * miembros que el spec sí pide.
 *
 * `landmarks` devuelve siempre vacío, que es exactamente lo que el lado JS
 * ya sabe manejar: `computeGarmentTransform` oculta la prenda cuando no hay
 * hombros con visibilidad suficiente. En iOS se ve la cámara sin prenda
 * superpuesta, no una pantalla rota. Además `usePoseLandmarks` ni siquiera
 * llama a estos métodos fuera de Android.
 *
 * Para implementarlo de verdad, el equivalente de ML Kit es Vision
 * (`VNDetectHumanBodyPoseRequest`), que da 19 puntos y habría que mapear al
 * esquema de 33 de MediaPipe/BlazePose que usa `pose.types.ts`.
 */
class MirroriaPoseDetector: HybridMirroriaPoseDetectorSpec {
  var landmarks: [PoseLandmark] {
    return []
  }

  func processFrameAndroid(frame: (any HybridFrameSpec)) throws -> Void {
    // Solo Android. Ver el comentario de la clase.
  }

  func processFrameIOS(frame: (any HybridFrameSpec)) throws -> Void {
    // Sin implementar a propósito. Ver el comentario de la clase.
  }
}
