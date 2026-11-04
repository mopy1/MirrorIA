import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { LimitePorIp } from '../../../core/security/limite-por-ip.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import type { AuthResponseDto, UsuarioResponseDto } from '../dto/auth-response.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import { AuthService } from '../service/auth.service.js';

@ApiTags('seguridad/auth')
@Controller('seguridad/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Bootstrap/desarrollo: crea clientes (role CUSTOMER) sin necesitar un admin previo.
  // Igual que en erp-backend/case-backend, en producción real la alta de personal
  // interno (ADMIN/ENCARGADO_SUCURSAL/CAJERO) debería quedar detrás de un endpoint
  // protegido por rol ADMIN, no de este registro público.
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  // Anti fuerza bruta: 10 intentos cada 5 min por IP (429).
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LimitePorIp(10, 5 * 60_000))
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload): Promise<UsuarioResponseDto> {
    return this.authService.getPerfil(user.sub);
  }
}
