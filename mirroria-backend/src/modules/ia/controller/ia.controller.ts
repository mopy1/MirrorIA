import {
  Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { LimitePorIp } from '../../../core/security/limite-por-ip.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { InteraccionResponseDto } from '../dto/interaccion-response.dto.js';
import { PromptDto } from '../dto/prompt.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import { ReporteHibridoResponseDto } from '../dto/reporte-hibrido-response.dto.js';
import { IaService } from '../service/ia.service.js';

const PIPE_FICHA = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@ApiTags('IA')
@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('reportes')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, LimitePorIp(20, 10 * 60_000))
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Reporte dinamico a partir de una pregunta en lenguaje natural (CU24)' })
  reportes(@Body() dto: PromptDto, @CurrentUser() user: JwtPayload): Promise<ReporteResponseDto> {
    return this.iaService.preguntar(dto, user);
  }

  @Post('reportes/hibrido')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, LimitePorIp(20, 10 * 60_000))
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Reporte analitico hibrido multi-paso con DuckDB y agente IA' })
  reporteHibrido(@Body() dto: PromptDto, @CurrentUser() user: JwtPayload): Promise<ReporteHibridoResponseDto> {
    return this.iaService.reporteHibrido(dto, user);
  }

  @Post('reportes/consulta')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, LimitePorIp(20, 10 * 60_000))
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Ejecutar una ficha de consulta ya armada (sin IA)' })
  @ApiBody({ type: FichaConsultaDto })
  async consulta(@Body() body: unknown, @CurrentUser() user: JwtPayload): Promise<ReporteResponseDto> {
    const ficha = (await PIPE_FICHA.transform(body, {
      type: 'body',
      metatype: FichaConsultaDto,
    })) as FichaConsultaDto;
    return this.iaService.consultar(ficha, user);
  }

  @Get('interacciones')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Historial de consultas al asistente' })
  interacciones(@CurrentUser() user: JwtPayload): Promise<InteraccionResponseDto[]> {
    return this.iaService.historial(user);
  }
}
