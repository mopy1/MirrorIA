import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { buildTypeOrmOptions } from './core/config/typeorm.config.js';
import { CoreSecurityModule } from './core/security/core-security.module.js';
import { CatalogoModule } from './modules/catalogo/catalogo.module.js';
import { IaModule } from './modules/ia/ia.module.js';
import { InventarioModule } from './modules/inventario/inventario.module.js';
import { PagosModule } from './modules/pagos/pagos.module.js';
import { PromocionesModule } from './modules/promociones/promociones.module.js';
import { ProveedoresModule } from './modules/proveedores/proveedores.module.js';
import { ReservasModule } from './modules/reservas/reservas.module.js';
import { SeguridadModule } from './modules/seguridad/seguridad.module.js';
import { SucursalesModule } from './modules/sucursales/sucursales.module.js';
import { VentasModule } from './modules/ventas/ventas.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    // @Global() — expone PassportModule a cualquier controller de cualquier
    // módulo que use @UseGuards(JwtAuthGuard). Ver ese archivo para el porqué.
    CoreSecurityModule,

    // Módulos de negocio (uno por dominio, ver Diseño_BD.md en el vault para el
    // detalle de tablas de cada uno). Solo `seguridad` está implementado hoy;
    // el resto son placeholders — ver AGENTS.md, sección Roadmap.
    SeguridadModule,
    SucursalesModule,
    ProveedoresModule,
    CatalogoModule,
    InventarioModule,
    ReservasModule,
    VentasModule,
    PagosModule,
    PromocionesModule,
    IaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
