package com.margelo.nitro.mirroriaposedetector

import android.util.Log
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import com.google.mlkit.vision.pose.PoseLandmark as MlKitPoseLandmark
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.public.NativeFrame
import java.util.concurrent.TimeUnit

/**
 * Detección de pose en vivo con ML Kit, llamada desde un Frame Processor de
 * VisionCamera. `processFrameAndroid` corre síncrono (bloqueando el hilo del
 * worklet con un timeout corto) porque el `ImageProxy` del frame solo es
 * válido hasta que el worklet de JS llama `frame.dispose()` al volver de
 * este método — no hay forma segura de seguir usándolo después de forma
 * asíncrona. `PoseLandmark` sin calificar es el data class que generó
 * nitrogen (mismo paquete que este archivo); `MlKitPoseLandmark` es el de
 * la librería de Google, con el mismo nombre — de ahí el alias.
 */
@DoNotStrip
@Keep
class MirroriaPoseDetector : HybridMirroriaPoseDetectorSpec() {
  private val poseDetector: PoseDetector by lazy {
    PoseDetection.getClient(
      PoseDetectorOptions.Builder()
        .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
        .build()
    )
  }

  @Volatile
  private var _landmarks: Array<PoseLandmark> = emptyArray()
  override val landmarks: Array<PoseLandmark>
    get() = _landmarks

  // ML Kit -> índice fijo 0-32 del esquema MediaPipe/BlazePose, para que el
  // lado JS pueda nombrar cada punto por posición (ver pose.types.ts).
  private val landmarkIndex = mapOf(
    MlKitPoseLandmark.NOSE to 0,
    MlKitPoseLandmark.LEFT_EYE_INNER to 1,
    MlKitPoseLandmark.LEFT_EYE to 2,
    MlKitPoseLandmark.LEFT_EYE_OUTER to 3,
    MlKitPoseLandmark.RIGHT_EYE_INNER to 4,
    MlKitPoseLandmark.RIGHT_EYE to 5,
    MlKitPoseLandmark.RIGHT_EYE_OUTER to 6,
    MlKitPoseLandmark.LEFT_EAR to 7,
    MlKitPoseLandmark.RIGHT_EAR to 8,
    MlKitPoseLandmark.LEFT_MOUTH to 9,
    MlKitPoseLandmark.RIGHT_MOUTH to 10,
    MlKitPoseLandmark.LEFT_SHOULDER to 11,
    MlKitPoseLandmark.RIGHT_SHOULDER to 12,
    MlKitPoseLandmark.LEFT_ELBOW to 13,
    MlKitPoseLandmark.RIGHT_ELBOW to 14,
    MlKitPoseLandmark.LEFT_WRIST to 15,
    MlKitPoseLandmark.RIGHT_WRIST to 16,
    MlKitPoseLandmark.LEFT_PINKY to 17,
    MlKitPoseLandmark.RIGHT_PINKY to 18,
    MlKitPoseLandmark.LEFT_INDEX to 19,
    MlKitPoseLandmark.RIGHT_INDEX to 20,
    MlKitPoseLandmark.LEFT_THUMB to 21,
    MlKitPoseLandmark.RIGHT_THUMB to 22,
    MlKitPoseLandmark.LEFT_HIP to 23,
    MlKitPoseLandmark.RIGHT_HIP to 24,
    MlKitPoseLandmark.LEFT_KNEE to 25,
    MlKitPoseLandmark.RIGHT_KNEE to 26,
    MlKitPoseLandmark.LEFT_ANKLE to 27,
    MlKitPoseLandmark.RIGHT_ANKLE to 28,
    MlKitPoseLandmark.LEFT_HEEL to 29,
    MlKitPoseLandmark.RIGHT_HEEL to 30,
    MlKitPoseLandmark.LEFT_FOOT_INDEX to 31,
    MlKitPoseLandmark.RIGHT_FOOT_INDEX to 32,
  )

  override fun processFrameAndroid(frame: HybridFrameSpec) {
    val nativeFrame = frame as? NativeFrame
    if (nativeFrame == null) {
      Log.w(TAG, "frame no es NativeFrame: ${frame::class.java}")
      return
    }
    val imageProxy = nativeFrame.image
    val mediaImage = imageProxy.image
    if (mediaImage == null) {
      Log.w(TAG, "imageProxy.image es null")
      return
    }

    try {
      val rotation = imageProxy.imageInfo.rotationDegrees
      val inputImage = InputImage.fromMediaImage(mediaImage, rotation)

      val rotated = rotation == 90 || rotation == 270
      val width = (if (rotated) mediaImage.height else mediaImage.width).toDouble()
      val height = (if (rotated) mediaImage.width else mediaImage.height).toDouble()

      // Bloquea el hilo del worklet a propósito: el ImageProxy deja de ser
      // válido apenas retornamos (VisionCamera lo libera cuando el worklet
      // de JS llama frame.dispose()), así que procesar async y cachear el
      // resultado más tarde leería memoria ya liberada.
      val pose = try {
        Tasks.await(poseDetector.process(inputImage), 800, TimeUnit.MILLISECONDS)
      } catch (e: Exception) {
        Log.w(TAG, "Tasks.await falló/timeout: ${e.javaClass.simpleName}: ${e.message}")
        null
      }
      if (pose == null) return

      val detected = pose.allPoseLandmarks
      Log.d(TAG, "ML Kit devolvió ${detected.size} landmarks (rotation=$rotation, ${width}x$height)")
      if (detected.isEmpty()) {
        _landmarks = emptyArray()
        return
      }

      val ordered = Array(33) { PoseLandmark(0.0, 0.0, 0.0, 0.0) }
      for (landmark in detected) {
        val index = landmarkIndex[landmark.landmarkType] ?: continue
        ordered[index] = PoseLandmark(
          x = (landmark.position3D.x / width).coerceIn(0.0, 1.0),
          y = (landmark.position3D.y / height).coerceIn(0.0, 1.0),
          z = landmark.position3D.z.toDouble(),
          visibility = landmark.inFrameLikelihood.toDouble(),
        )
      }
      _landmarks = ordered
    } catch (e: Exception) {
      Log.e(TAG, "processFrameAndroid excepción: ${e.javaClass.simpleName}: ${e.message}", e)
    }
    // No cerramos el ImageProxy nosotros: VisionCamera es dueño del ciclo de
    // vida del frame y lo libera cuando el worklet de JS llama dispose().
  }

  override fun processFrameIOS(frame: HybridFrameSpec) {
    // No implementado — probador AR es Android-first (ver plan de fases).
  }

  companion object {
    private const val TAG = "MirroriaPoseDetector"
  }
}
