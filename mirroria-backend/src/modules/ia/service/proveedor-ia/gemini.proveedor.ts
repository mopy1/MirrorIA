import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FichaConsultaDto } from '../../dto/ficha-consulta.dto.js';
import type { FilaReporte } from '../motor-consulta.service.js';
import { construirInstruccion, ESQUEMA_FICHA } from './esquema-ficha.js';
import type { ProveedorIa } from './proveedor-ia.interface.js';

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Habla con Gemini por HTTP directo: Node trae `fetch` global desde la v18
 * (este proyecto corre en v22), asi que no hace falta agregar un SDK al
 * proyecto (una dependencia menos que mantener). `responseSchema` obliga al
 * modelo a devolver JSON con la forma de la ficha.
 *
 * Modelo por defecto verificado contra la documentacion vigente de Google
 * (ai.google.dev/gemini-api/docs/models) el 21-sep-2026: `gemini-2.0-flash`
 * fue retirado el 1-jun-2026 y `gemini-2.5-flash` se retira el 16-oct-2026,
 * asi que el default se fija en `gemini-3.8-flash` (modelo Flash estable
 * vigente a esa fecha). El header de autenticacion `x-goog-api-key` sigue
 * siendo el vigente. Si esto vuelve a cambiar, ajustar solo aca: esta todo
 * en un solo archivo a proposito.
 */
@Injectable()
export class GeminiProveedor implements ProveedorIa {
  private readonly logger = new Logger(GeminiProveedor.name);
  private readonly apiKey: string | undefined;
  private readonly modelo: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('IA_API_KEY');
    this.modelo = config.get<string>('IA_MODELO') ?? 'gemini-3.8-flash';
  }

  estaConfigurado(): boolean {
    return Boolean(this.apiKey);
  }

  async extraerFicha(texto: string): Promise<unknown> {
    const json = await this.generar({
      systemInstruction: { parts: [{ text: construirInstruccion() }] },
      contents: [{ role: 'user', parts: [{ text: texto }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: ESQUEMA_FICHA,
        temperature: 0,
      },
    });
    if (json === null) return null;
    try {
      return JSON.parse(json) as unknown;
    } catch {
      return null;
    }
  }

  async narrar(ficha: FichaConsultaDto, filas: FilaReporte[]): Promise<string | null> {
    const datos = filas.map((f) => `${f.etiqueta}: ${f.valor}`).join('; ');
    return this.generar({
      systemInstruction: {
        parts: [
          {
            text:
              'Redacta en espanol un resumen ejecutivo de 2 o 3 frases sobre estos datos. ' +
              'Usa SOLO los numeros que te doy: no estimes, no inventes, no agregues contexto. ' +
              'Los montos vienen en centavos de boliviano.',
          },
        ],
      },
      contents: [
        { role: 'user', parts: [{ text: `Metrica: ${ficha.metrica}. Datos: ${datos || 'sin resultados'}` }] },
      ],
      generationConfig: { temperature: 0.2 },
    });
  }

  /**
   * `null` cuando Gemini responde con un status que no es `ok`: dejar pasar un
   * string vacio en ese caso disfrazaria un fallo del modelo como un exito con
   * texto en blanco. Ver `extraerFicha`/`narrar` para como cada uno interpreta
   * ese `null`.
   */
  private async generar(cuerpo: unknown): Promise<string | null> {
    const res = await fetch(`${URL_BASE}/${this.modelo}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey ?? '' },
      body: JSON.stringify(cuerpo),
    });

    if (!res.ok) {
      this.logger.error(`Gemini respondio ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}
