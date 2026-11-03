import { createDecartClient } from '@decartai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly pedidosPorIp = new Map<string, { desde: number; n: number }>();

  constructor(private readonly config: ConfigService) {}

  async crearToken(ip: string): Promise<TokenProbadorResponseDto> {
    const apiKey = this.config.get<string>('DECART_API_KEY');
    if (!apiKey) throw new ProbadorNoConfiguradoException();
    this.contarPedido(ip);

    const client = createDecartClient({ apiKey });
    const token = await client.tokens.create({
      expiresIn: SEGUNDOS_DE_VIDA_DEL_TOKEN,
      allowedModels: [MODELO_VTON],
    });
    return { apiKey: token.apiKey, expiresAt: token.expiresAt };
  }

  private contarPedido(ip: string): void {
    const ahora = Date.now();
    // Barre ventanas vencidas para que el Map no crezca sin limite.
    for (const [clave, v] of this.pedidosPorIp) {
      if (ahora - v.desde >= VENTANA_MS) this.pedidosPorIp.delete(clave);
    }
    const actual = this.pedidosPorIp.get(ip) ?? { desde: ahora, n: 0 };
    if (actual.n >= MAX_TOKENS_POR_IP) throw new LimiteTokensProbadorException();
    actual.n++;
    this.pedidosPorIp.set(ip, actual);
  }
}
