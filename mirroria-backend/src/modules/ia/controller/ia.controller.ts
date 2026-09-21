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
import { PromptDto } from '../dto/prompt.dto.js';
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

  @Post('reportes')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Reporte dinamico a partir de una pregunta en lenguaje natural (CU24)' })
  reportes(@Body() dto: PromptDto, @CurrentUser() user: JwtPayload): Promise<ReporteResponseDto> {
    return this.iaService.preguntar(dto, user);
  }

  /**
   * NO cambiar `@Body() body: unknown` por `@Body(PIPE_FICHA) ficha: FichaConsultaDto`:
   * se ve mas simple pero rompe el 400 de "propiedad inventada" en silencio.
   *
   * Los ValidationPipe se ENCADENAN por parametro: primero el GLOBAL de main.ts
   * (`{ whitelist: true, transform: true }`, sin `forbidNonWhitelisted`), despues
   * el de esta ruta — cada uno recibe la salida transformada del anterior. Si el
   * parametro estuviera tipado `FichaConsultaDto`, el pipe global correria
   * primero, encontraria una clase que validar y borraria en silencio cualquier
   * propiedad que el modelo invente (whitelist sin forbidNonWhitelisted elimina,
   * no rechaza) — para cuando PIPE_FICHA corriera, ya no quedaria nada que
   * rechazar y el endpoint devolveria 200 en vez de 400. Probado en
   * test/ia.e2e-spec.ts.
   *
   * Tipando el body como `unknown` el metatype que ve el pipe global resuelve a
   * `Object`, y `ValidationPipe.toValidate()` salta la validacion para eso (no es
   * una clase) dejando el body intacto. Asi PIPE_FICHA, invocado a mano aca abajo,
   * es el primero en tocarlo de verdad y si puede rechazar con 400.
   */
  @Post('reportes/consulta')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Ejecutar una ficha de consulta ya armada (sin IA)' })
  @ApiBody({ type: FichaConsultaDto })
  async consulta(
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
