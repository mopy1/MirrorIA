import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CobroWayraResponseDto,
  ComprobanteWayraResponseDto,
  PagarWayraDto,
} from '../dto/wayra.dto.js';
import { WayraBancoService } from '../service/wayra/wayra-banco.service.js';

/**
 * La "app del banco" Wayra (simulado). Publico a proposito: quien escanea el QR
 * no tiene cuenta en MirrorIA. El token de la URL es la unica llave.
 */
@ApiTags('Wayra (banco simulado)')
@Controller('wayra')
export class WayraController {
  constructor(private readonly wayra: WayraBancoService) {}

  @Get('cobros/:token')
  @ApiOperation({ summary: 'Lo que ve el banco al escanear un QR de cobro' })
  ver(@Param('token') token: string): Promise<CobroWayraResponseDto> {
    return this.wayra.verCobro(token);
  }

  @Post('cobros/:token/pagar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Pagar el QR desde una cuenta de prueba (PIN de 4 digitos cualquiera)',
  })
  pagar(
    @Param('token') token: string,
    @Body() dto: PagarWayraDto,
  ): Promise<ComprobanteWayraResponseDto> {
    return this.wayra.pagar(token, dto);
  }
}
