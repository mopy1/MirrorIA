import { createDecartClient } from '@decartai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LimitadorPorIp } from '../../../core/security/limite-por-ip.js';
import { LimiteTokensProbadorException } from '../exception/limite-tokens-probador.exception.js';
import { ProbadorNoConfiguradoException } from '../exception/probador-no-configurado.exception.js';
import type { TokenProbadorResponseDto } from '../dto/token-probador-response.dto.js';

// Token efimero: la clave permanente (DECART_API_KEY) nunca sale de este
// servidor. El navegador solo recibe el `apiKey` de corta duracion que
// devuelve `tokens.create`, restringido al modelo que el probador necesita
// (RF13, ver mirroria-frontend/AGENTS.md) — mismo criterio de "cliente nunca
// ve la clave real" que ya usa `pagos` con Stripe.
const MODELO_VTON = 'lucy-vton-3.5';
const SEGUNDOS_DE_VIDA_DEL_TOKEN = 300;
// El endpoint es publico: sin tope, cualquiera quema creditos de Decart.
// Ventana fija en memoria (una sola instancia del backend, sin dependencia).
const MAX_TOKENS_POR_IP = 10;
const VENTANA_MS = 10 * 60 * 1000;

@Injectable()
export class ProbadorService {
  private readonly limitador = new LimitadorPorIp(MAX_TOKENS_POR_IP, VENTANA_MS);

  constructor(private readonly config: ConfigService) {}

  async crearToken(ip: string): Promise<TokenProbadorResponseDto> {
    const apiKey = this.config.get<string>('DECART_API_KEY');
    if (!apiKey) throw new ProbadorNoConfiguradoException();
    // Se cuenta recién con la clave configurada (como antes): sin Decart no hay creditos que cuidar.
    if (!this.limitador.permitir(ip)) throw new LimiteTokensProbadorException();

    const client = createDecartClient({ apiKey });
    const token = await client.tokens.create({
      expiresIn: SEGUNDOS_DE_VIDA_DEL_TOKEN,
      allowedModels: [MODELO_VTON],
    });
    return { apiKey: token.apiKey, expiresAt: token.expiresAt };
  }
}
