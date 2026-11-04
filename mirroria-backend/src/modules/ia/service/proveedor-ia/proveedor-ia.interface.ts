import type { FichaConsultaDto } from '../../dto/ficha-consulta.dto.js';
import type { ComparacionDto } from '../../dto/reporte-response.dto.js';
import type { FilaReporte } from '../motor-consulta.service.js';

export const PROVEEDOR_IA = Symbol('PROVEEDOR_IA');

export interface ToolCallResult {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface MensajeIa {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export interface ProveedorIa {
  extraerFicha(texto: string): Promise<unknown>;
  narrar(
    ficha: FichaConsultaDto,
    filas: FilaReporte[],
    comparacion?: ComparacionDto | null,
  ): Promise<string | null>;
  chatearConTools?(
    mensajes: MensajeIa[],
    tools: unknown[],
  ): Promise<{ contenido: string | null; toolCalls?: ToolCallResult[] }>;
  estaConfigurado(): boolean;
}
