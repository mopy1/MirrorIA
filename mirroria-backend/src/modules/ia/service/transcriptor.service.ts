import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranscripcionException } from '../exception/transcripcion.exception.js';

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const TIMEOUT_MS = 30_000;
const SIN_VOZ = 'SIN_VOZ';

export const INSTRUCCION_TRANSCRIPCION =
  'Transcribe literalmente lo que se dice en este audio, en el idioma en que se habla (normalmente español). ' +
  'Responde solo con la transcripción, sin comillas ni comentarios. ' +
  `Si no se escucha ninguna voz, responde exactamente: ${SIN_VOZ}`;

/** "audio/webm;codecs=opus" → "audio/webm": Gemini espera el tipo sin parámetros. */
export function tipoBaseAudio(mime: string | undefined): string {
  const base = (mime ?? '').split(';')[0].trim().toLowerCase();
  return base || 'audio/webm';
}

/**
 * Respaldo del dictado de Reportes: cuando la Web Speech API del navegador no
 * llega a su servicio (Brave, Opera, red que lo bloquea → error `network`), el
 * front graba el audio y lo manda acá; Gemini lo pasa a texto. El audio no se
 * guarda: se transcribe y se descarta.
 */
@Injectable()
export class TranscriptorService {
  private readonly logger = new Logger(TranscriptorService.name);
  private readonly apiKey?: string;
  private readonly modelo: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GEMINI_API_KEY') || undefined;
    this.modelo = config.get<string>('GEMINI_MODELO') || 'gemini-2.5-flash';
  }

  async transcribir(audio: Buffer | undefined, mime: string | undefined): Promise<string> {
    if (!this.apiKey) throw TranscripcionException.noConfigurada();
    if (!audio?.length) throw TranscripcionException.audioInvalido();

    const cuerpo = {
      contents: [{
        role: 'user',
        parts: [
          { text: INSTRUCCION_TRANSCRIPCION },
          { inline_data: { mime_type: tipoBaseAudio(mime), data: audio.toString('base64') } },
        ],
      }],
      generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
    };

    let res: Response;
    try {
      res = await fetch(`${URL_BASE}/models/${this.modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      this.logger.error(`Gemini no respondió: ${err instanceof Error ? err.message : String(err)}`);
      throw TranscripcionException.noDisponible();
    }

    if (!res.ok) {
      this.logger.error(`Gemini respondió ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`);
      if (res.status === 429) throw TranscripcionException.limite();
      if (res.status === 400) throw TranscripcionException.audioInvalido();
      throw TranscripcionException.noDisponible();
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
    };
    const texto = (data.candidates?.[0]?.content?.parts ?? [])
      .filter((p) => !p.thought)
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!texto || texto === SIN_VOZ) throw TranscripcionException.sinVoz();
    return texto;
  }
}
