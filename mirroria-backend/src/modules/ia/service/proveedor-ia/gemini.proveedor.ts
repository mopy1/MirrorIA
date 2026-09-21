import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FichaConsultaDto } from '../../dto/ficha-consulta.dto.js';
import type { ComparacionDto } from '../../dto/reporte-response.dto.js';
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

  async narrar(
    ficha: FichaConsultaDto,
    filas: FilaReporte[],
    comparacion?: ComparacionDto | null,
  ): Promise<string | null> {
    const datos = filas.map((f) => `${f.etiqueta}: ${f.valor}`).join('; ');

    let instruccion =
      'Redacta en espanol un resumen ejecutivo de 2 o 3 frases sobre estos datos. ' +
      'Usa SOLO los numeros que te doy: no estimes, no inventes, no agregues contexto. ' +
      'Los montos vienen en centavos de boliviano.';
    let texto = `Metrica: ${ficha.metrica}. Datos: ${datos || 'sin resultados'}`;

    // Si la ficha comparo dos periodos, la variacion ES la respuesta a la pregunta
    // ("¿vendi mas que el mes pasado?"). Sin esto el modelo la ignoraba y redactaba
    // sobre el periodo actual como si la otra mitad de la tabla no existiera.
    if (comparacion) {
      instruccion +=
        ' El reporte COMPARA dos periodos: nombra la variacion (si subio o bajo, y cuanto) ' +
        'porque es lo que se pregunto. Un porcentaje ausente significa que el periodo ' +
        'anterior fue cero, no que no haya habido cambio.';
      const variaciones = comparacion.variaciones
        .map((v) => {
          const signo = v.deltaAbsoluto >= 0 ? '+' : '';
          const pct = v.deltaPorcentual === null ? 'sin base anterior' : `${v.deltaPorcentual}%`;
          return `${v.etiqueta}: antes ${v.anterior}, ahora ${v.actual} (${signo}${v.deltaAbsoluto}, ${pct})`;
        })
        .join('; ');
      texto +=
        `. Periodo de comparacion (${comparacion.rango.desde} a ${comparacion.rango.hasta}): ` +
        `${variaciones || 'sin resultados'}`;
    }

    return this.generar({
      systemInstruction: { parts: [{ text: instruccion }] },
      contents: [{ role: 'user', parts: [{ text: texto }] }],
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
