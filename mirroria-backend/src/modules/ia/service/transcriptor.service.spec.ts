import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { TranscriptorService, tipoBaseAudio } from './transcriptor.service.js';

function servicio(clave: string | undefined = 'clave-de-prueba'): TranscriptorService {
  const config = { get: (k: string) => (k === 'GEMINI_API_KEY' ? clave : undefined) } as unknown as ConfigService;
  return new TranscriptorService(config);
}

function respuestaGemini(status: number, parts: Array<{ text?: string; thought?: boolean }> = []) {
  const espia = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve('detalle'),
    json: () => Promise.resolve({ candidates: [{ content: { parts } }] }),
  });
  vi.stubGlobal('fetch', espia);
  return espia;
}

const AUDIO = Buffer.from('audio-falso');

describe('TranscriptorService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('manda el audio en base64 con su tipo sin parámetros y devuelve el texto', async () => {
    const espia = respuestaGemini(200, [{ text: 'pensando', thought: true }, { text: ' ¿Qué vendí más este mes? ' }]);
    const texto = await servicio().transcribir(AUDIO, 'audio/webm;codecs=opus');
    expect(texto).toBe('¿Qué vendí más este mes?');
    const [url, init] = espia.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toContain('gemini-2.5-flash:generateContent');
    expect(init.headers['x-goog-api-key']).toBe('clave-de-prueba');
    const parte = JSON.parse(init.body).contents[0].parts[1].inline_data;
    expect(parte).toEqual({ mime_type: 'audio/webm', data: AUDIO.toString('base64') });
  });

  it('sin clave responde 503 y no llama a Gemini', async () => {
    const espia = respuestaGemini(200, [{ text: 'x' }]);
    await expect(servicio('').transcribir(AUDIO, 'audio/webm')).rejects.toMatchObject({ status: 503 });
    expect(espia).not.toHaveBeenCalled();
  });

  it('si Gemini no oye voz responde 422', async () => {
    respuestaGemini(200, [{ text: 'SIN_VOZ' }]);
    await expect(servicio().transcribir(AUDIO, 'audio/webm')).rejects.toMatchObject({ status: 422 });
  });

  it('traduce el límite de Gemini a 429 y otros fallos a 503', async () => {
    respuestaGemini(429);
    await expect(servicio().transcribir(AUDIO, 'audio/webm')).rejects.toMatchObject({ status: 429 });
    respuestaGemini(500);
    await expect(servicio().transcribir(AUDIO, 'audio/webm')).rejects.toMatchObject({ status: 503 });
  });

  it('sin audio o con audio vacío es 400', async () => {
    respuestaGemini(200, [{ text: 'x' }]);
    await expect(servicio().transcribir(Buffer.alloc(0), 'audio/webm')).rejects.toMatchObject({ status: 400 });
    await expect(servicio().transcribir(undefined, undefined)).rejects.toMatchObject({ status: 400 });
  });

  it('tipoBaseAudio quita parámetros y usa webm por defecto', () => {
    expect(tipoBaseAudio('audio/ogg; codecs=opus')).toBe('audio/ogg');
    expect(tipoBaseAudio(undefined)).toBe('audio/webm');
  });
});
