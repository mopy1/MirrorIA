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
import { PermitirTiendaNoDisponible } from '../../../core/tenancy/permitir-tienda-no-disponible.decorator.js';
import { SinTenant } from '../../../core/tenancy/sin-tenant.decorator.js';
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

  // Crea una CUSTOMER en la tienda de X-Tenant (400 sin la cabecera).
  // Igual que en erp-backend/case-backend, en producción real la alta de personal
  // interno (ADMIN/ENCARGADO_SUCURSAL/CAJERO) debería quedar detrás de un endpoint
  // protegido por rol ADMIN, no de este registro público.
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  // Anti fuerza bruta: 10 intentos cada 5 min por IP (429). X-Tenant opcional:
  // sin cabecera solo entran las cuentas de plataforma. Anda con la tienda
  // vencida/suspendida para que su ADMIN llegue a /admin/suscripcion.
  @Post('login')
  @SinTenant()
  @PermitirTiendaNoDisponible()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LimitePorIp(10, 5 * 60_000))
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  // Sin tienda para la cuenta de plataforma; con tienda vencida sigue andando.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @SinTenant()
  @PermitirTiendaNoDisponible()
  me(@CurrentUser() user: JwtPayload): Promise<UsuarioResponseDto> {
    return this.authService.getPerfil(user.sub);
  }
}
