import {
  Body, Controller, HttpCode, HttpStatus, Post, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import { IaService } from '../service/ia.service.js';

/**
 * El ValidationPipe GLOBAL de main.ts es `{ whitelist: true, transform: true }`: sin
 * `forbidNonWhitelisted`, una propiedad que el modelo invente se descartaria EN SILENCIO
 * en vez de dar 400, y la ficha dejaria de ser cerrada. Se agrega con alcance de ruta y
 * NO se toca el pipe global, que rige todos los endpoints del resto de la app.
 */
const PIPE_FICHA = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@ApiTags('IA')
@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('reportes/consulta')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Ejecutar una ficha de consulta ya armada (sin IA)' })
  @ApiBody({ type: FichaConsultaDto })
  async consulta(
    /**
     * Los pipes se ENCADENAN (global, luego los de la ruta) y cada uno recibe la
     * salida del anterior. Si este parametro estuviera tipado `FichaConsultaDto`,
     * el pipe GLOBAL correria primero, encontraria una clase que validar y
     * borraria en silencio cualquier propiedad inventada (whitelist sin
     * forbidNonWhitelisted) ANTES de que PIPE_FICHA la viera — nunca daria 400.
     * Tipando el body como `unknown`, `ValidationPipe.toValidate()` del pipe
     * global no encuentra una clase (metatype resuelve a `Object`) y lo deja
     * intacto, asi PIPE_FICHA es el primero en tocarlo de verdad.
     */
    @Body() body: unknown,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReporteResponseDto> {
    const ficha = (await PIPE_FICHA.transform(body, {
      type: 'body',
      metatype: FichaConsultaDto,
    })) as FichaConsultaDto;
    return this.iaService.consultar(ficha, user);
  }
}
