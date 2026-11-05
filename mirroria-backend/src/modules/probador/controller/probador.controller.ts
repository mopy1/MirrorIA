import { Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ipDelPedido } from '../../../core/security/limite-por-ip.js';
import { SinTenant } from '../../../core/tenancy/sin-tenant.decorator.js';
import type { TokenProbadorResponseDto } from '../dto/token-probador-response.dto.js';
import { ProbadorService } from '../service/probador.service.js';

// Publico a proposito, sin JwtAuthGuard: /probador (RF13) no exige sesion,
// probarse una prenda no necesita cuenta (mismo criterio ya documentado en
// mirroria-frontend/AGENTS.md para esa ruta).
@ApiTags('probador')
@SinTenant()
@Controller('probador')
export class ProbadorController {
  constructor(private readonly probadorService: ProbadorService) {}

  @Post('token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Token efimero de Decart para el probador virtual (RF13); max. 10 cada 10 min por IP (429)',
  })
  crearToken(@Req() req: Request): Promise<TokenProbadorResponseDto> {
    const ip = ipDelPedido(req); // X-Real-IP de nginx, si no la del socket
    return this.probadorService.crearToken(ip);
  }
}
