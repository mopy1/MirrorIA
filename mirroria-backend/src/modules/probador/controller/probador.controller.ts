import { Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { TokenProbadorResponseDto } from '../dto/token-probador-response.dto.js';
import { ProbadorService } from '../service/probador.service.js';

// Publico a proposito, sin JwtAuthGuard: /probador (RF13) no exige sesion,
// probarse una prenda no necesita cuenta (mismo criterio ya documentado en
// mirroria-frontend/AGENTS.md para esa ruta).
@ApiTags('probador')
@Controller('probador')
export class ProbadorController {
  constructor(private readonly probadorService: ProbadorService) {}

  @Post('token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Token efimero de Decart para el probador virtual (RF13); max. 10 cada 10 min por IP (429)',
  })
  crearToken(@Req() req: Request): Promise<TokenProbadorResponseDto> {
    // Detras de Nginx el socket es siempre el del contenedor de nginx: la IP
    // real llega en X-Real-IP ($remote_addr, que nginx pisa y el cliente no
    // puede falsear). Sin nginx (movil directo a :3000), la del socket.
    const ip = req.header('x-real-ip') ?? req.ip ?? 'desconocida';
    return this.probadorService.crearToken(ip);
  }
}
