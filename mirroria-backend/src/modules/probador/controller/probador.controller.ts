import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Token efimero de Decart para el probador virtual (RF13)' })
  crearToken(): Promise<TokenProbadorResponseDto> {
    return this.probadorService.crearToken();
  }
}
