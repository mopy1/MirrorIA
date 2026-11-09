import {
  Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { LimitePorIp } from '../../../core/security/limite-por-ip.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { ExportarReporteDto } from '../dto/exportar-reporte.dto.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { InteraccionResponseDto } from '../dto/interaccion-response.dto.js';
import { PromptDto } from '../dto/prompt.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import { ReporteHibridoResponseDto } from '../dto/reporte-hibrido-response.dto.js';
import { ExportadorExcelService } from '../service/exportador-excel.service.js';
import { ExportadorPdfService } from '../service/exportador-pdf.service.js';
import { IaService } from '../service/ia.service.js';

const PIPE_FICHA = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@ApiTags('IA')
@Controller('ia')
export class IaController {
  constructor(
    private readonly iaService: IaService,
    private readonly exportadorExcelService: ExportadorExcelService,
    private readonly exportadorPdfService: ExportadorPdfService,
  ) {}

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

  // Sin LLM (solo SQL armado desde la ficha): el tope es mas alto que el de las rutas con IA, porque
  // abrir Reportes ya dispara ~7 consultas y con 20 en 10 min la tercera visita (o un aula en el mismo WiFi) daba 429.
  @Post('reportes/consulta')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, LimitePorIp(200, 10 * 60_000))
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

  @Post('reportes/exportar-excel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, LimitePorIp(30, 5 * 60_000))
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Generar y descargar libro Excel (.xlsx) estructurado del reporte' })
  async exportarExcel(
    @Body() dto: ExportarReporteDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.exportadorExcelService.generarLibro(dto, user.email, user);
    const ficha = dto.ficha ?? dto.reporte?.ficha;
    const metrica = ficha?.metrica ?? 'reporte';
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `reporte_${metrica}_${fecha}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Post('reportes/exportar-pdf')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, LimitePorIp(30, 5 * 60_000))
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Generar y descargar el reporte en PDF' })
  async exportarPdf(
    @Body() dto: ExportarReporteDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.exportadorPdfService.generarDocumento(dto, user.email, user);
    const metrica = (dto.ficha ?? dto.reporte?.ficha)?.metrica ?? 'reporte';
    const fecha = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${metrica}_${fecha}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
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
