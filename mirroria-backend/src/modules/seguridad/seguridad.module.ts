import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalesModule } from '../sucursales/sucursales.module.js';
import { AuthController } from './controller/auth.controller.js';
import { UsuariosController } from './controller/usuarios.controller.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { Usuario } from './entities/usuario.entity.js';
import { JwtStrategy } from './security/jwt.strategy.js';
import { AuthService } from './service/auth.service.js';
import { UsuariosService } from './service/usuarios.service.js';

// PassportModule ya no se registra acá — lo provee CoreSecurityModule (@Global(),
// importado una sola vez en AppModule). Ver ese archivo para el porqué.
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev_secret_change_me'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    // Solo para validar sucursalId al asignar rol ENCARGADO_SUCURSAL/CAJERO
    // (UsuariosService) — ver mismo criterio que ColeccionesService/ProveedoresService.
    SucursalesModule,
  ],
  controllers: [AuthController, UsuariosController],
  providers: [AuthService, JwtStrategy, UsuariosService],
  exports: [AuthService],
})
export class SeguridadModule {}
