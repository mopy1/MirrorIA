import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FichaConsultaDto } from '../../dto/ficha-consulta.dto.js';
import type { ComparacionDto } from '../../dto/reporte-response.dto.js';
import type { FilaReporte } from '../motor-consulta.service.js';
import { construirInstruccion } from './esquema-ficha.js';
import type { ProveedorIa } from './proveedor-ia.interface.js';

const URL = 'https://api.deepseek.com/chat/completions';

/**
 * Habla con DeepSeek por HTTP directo (API compatible con OpenAI, mismo
 * criterio que `GeminiProveedor`: `fetch` global de Node, sin SDK nuevo).
 *
 * Diferencia real con Gemini que importa para `extraerFicha`: DeepSeek NO
 * soporta un JSON Schema forzado del lado del servidor (no hay equivalente a
 * `responseSchema`) — `response_format: {type: 'json_object'}` solo
 * garantiza JSON *valido*, no una forma en particular. Por eso
 * `construirInstruccion()` ahora describe el formato de salida en texto
 * (ver `esquema-ficha.ts`) — sin esa descripcion el modelo podia devolver
 * cualquier JSON, no necesariamente los campos de la ficha. La validacion
 * real de todos modos es responsabilidad del llamador (`IaService`, contra
 * `FichaConsultaDto`) — acá no cambia nada de esa parte.
 *
 * DeepSeek exige que la palabra "json" aparezca en algún mensaje cuando se
 * pide `json_object` (si no, la API devuelve un error) — la instruccion de
 * `extraerFicha` la incluye explicitamente por esto.
 */
@Injectable()
export class DeepSeekProveedor implements ProveedorIa {
  private readonly logger = new Logger(DeepSeekProveedor.name);
  private readonly apiKey: string | undefined;
  private readonly modelo: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('IA_API_KEY');
    this.modelo = config.get<string>('IA_MODELO') ?? 'deepseek-chat';
  }

  estaConfigurado(): boolean {
    return Boolean(this.apiKey);
  }

  async extraerFicha(texto: string): Promise<unknown> {
    const json = await this.generar(
      [
        { role: 'system', content: construirInstruccion() },
        { role: 'user', content: texto },
      ],
      { temperature: 0, response_format: { type: 'json_object' } },
    );
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

    return this.generar(
      [
        { role: 'system', content: instruccion },
        { role: 'user', content: texto },
      ],
      { temperature: 0.2 },
    );
  }

  /**
   * `null` cuando DeepSeek responde con un status que no es `ok`: dejar pasar
   * un string vacio en ese caso disfrazaria un fallo del modelo como un exito
   * con texto en blanco. Ver `extraerFicha`/`narrar` para como cada uno
   * interpreta ese `null`.
   */
  private async generar(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    opciones: { temperature: number; response_format?: { type: 'json_object' } },
  ): Promise<string | null> {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey ?? ''}`,
      },
      body: JSON.stringify({ model: this.modelo, messages, ...opciones }),
    });

    if (!res.ok) {
      this.logger.error(`DeepSeek respondio ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? '';
  }
}
