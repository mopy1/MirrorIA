import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FichaConsultaDto } from '../../dto/ficha-consulta.dto.js';
import { IaSinRespuestaException } from '../../exception/ia-sin-respuesta.exception.js';
import type { ComparacionDto } from '../../dto/reporte-response.dto.js';
import type { FilaReporte } from '../motor-consulta.service.js';
import { construirInstruccion } from './esquema-ficha.js';
import type { MensajeIa, ProveedorIa, ToolCallResult } from './proveedor-ia.interface.js';

const URL = 'https://api.deepseek.com/chat/completions';
const TIMEOUT_MS = 20_000;

interface DeepSeekChoiceMsg {
  content?: string | null;
  tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
}

@Injectable()
export class DeepSeekProveedor implements ProveedorIa {
  private readonly logger = new Logger(DeepSeekProveedor.name);
  private readonly apiKey?: string;
  private readonly modelo: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('IA_API_KEY');
    this.modelo = config.get<string>('IA_MODELO') ?? 'deepseek-chat';
  }

  estaConfigurado(): boolean {
    return Boolean(this.apiKey);
  }

  async extraerFicha(texto: string): Promise<unknown> {
    const raw = await this.generar(
      [{ role: 'system', content: construirInstruccion() }, { role: 'user', content: texto }],
      { temperature: 0, response_format: { type: 'json_object' } },
    );
    try {
      return raw?.content ? JSON.parse(raw.content) : null;
    } catch {
      return null;
    }
  }

  async narrar(ficha: FichaConsultaDto, filas: FilaReporte[], comp?: ComparacionDto | null): Promise<string | null> {
    const datos = filas.map((f) => `${f.etiqueta}: ${f.valor}`).join('; ');
    let inst = 'Redacta en espanol un resumen ejecutivo de 2 o 3 frases sobre estos datos. ' +
      'Usa SOLO los numeros que te doy: no estimes, no inventes, no agregues contexto. Los montos vienen en centavos de boliviano.';
    let texto = `Metrica: ${ficha.metrica}. Datos: ${datos || 'sin resultados'}`;

    if (comp) {
      inst += ' El reporte COMPARA dos periodos: nombra la variacion (si subio o bajo, y cuanto) porque es lo que se pregunto. ' +
        'Un porcentaje ausente significa que el periodo anterior fue cero, no que no haya habido cambio.';
      const vars = comp.variaciones
        .map((v) => `${v.etiqueta}: antes ${v.anterior}, ahora ${v.actual} (${v.deltaAbsoluto >= 0 ? '+' : ''}${v.deltaAbsoluto}, ${v.deltaPorcentual === null ? 'sin base anterior' : `${v.deltaPorcentual}%`})`)
        .join('; ');
      texto += `. Periodo de comparacion (${comp.rango.desde} a ${comp.rango.hasta}): ${vars || 'sin resultados'}`;
    }

    const res = await this.generar([{ role: 'system', content: inst }, { role: 'user', content: texto }], { temperature: 0.2 });
    return res?.content ?? null;
  }

  async chatearConTools(
    mensajes: MensajeIa[],
    tools: unknown[],
  ): Promise<{ contenido: string | null; toolCalls?: ToolCallResult[] }> {
    const res = await this.generar(mensajes, { temperature: 0.1, tools });
    if (!res) return { contenido: null };
    const toolCalls: ToolCallResult[] = [];
    if (res.tool_calls?.length) {
      for (const tc of res.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments); } catch {}
        toolCalls.push({ id: tc.id, name: tc.function.name, arguments: args });
      }
    }
    return { contenido: res.content ?? null, toolCalls: toolCalls.length ? toolCalls : undefined };
  }

  private async generar(
    messages: unknown[],
    opciones: Record<string, unknown>,
  ): Promise<DeepSeekChoiceMsg | null> {
    try {
      const res = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey ?? ''}` },
        body: JSON.stringify({ model: this.modelo, messages, ...opciones }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.error(`DeepSeek respondio ${res.status}: ${await res.text()}`);
        return null;
      }
      const data = (await res.json()) as { choices?: Array<{ message?: DeepSeekChoiceMsg }> };
      return data.choices?.[0]?.message ?? null;
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        this.logger.error(`DeepSeek no respondio en ${TIMEOUT_MS / 1000} s`);
        throw new IaSinRespuestaException(TIMEOUT_MS / 1000);
      }
      throw err;
    }
  }
}
