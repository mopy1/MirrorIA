import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

/** Fallo al pasar a texto una pregunta dictada (respaldo con Gemini del dictado del navegador). */
export class TranscripcionException extends BusinessException {
  constructor(message: string, status: HttpStatus) {
    super(message, status);
  }

  static noConfigurada(): TranscripcionException {
    return new TranscripcionException(
      'El dictado por voz no está configurado en el servidor (falta GEMINI_API_KEY). Escribí la pregunta.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  static sinVoz(): TranscripcionException {
    return new TranscripcionException(
      'No se escuchó ninguna pregunta en la grabación. Probá hablar más cerca del micrófono.',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  static audioInvalido(): TranscripcionException {
    return new TranscripcionException('Falta la grabación o no es un audio válido.', HttpStatus.BAD_REQUEST);
  }

  static limite(): TranscripcionException {
    return new TranscripcionException(
      'Se alcanzó el límite gratuito de transcripción. Esperá un minuto o escribí la pregunta.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  static noDisponible(): TranscripcionException {
    return new TranscripcionException(
      'El servicio de transcripción no respondió. Probá de nuevo o escribí la pregunta.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
