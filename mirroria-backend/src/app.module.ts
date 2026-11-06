import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { buildTypeOrmOptions } from './core/config/typeorm.config.js';
import { CoreSecurityModule } from './core/security/core-security.module.js';
import { TenantMiddleware } from './core/tenancy/tenant.middleware.js';
import { CatalogoModule } from './modules/catalogo/catalogo.module.js';
import { IaModule } from './modules/ia/ia.module.js';
import { InventarioModule } from './modules/inventario/inventario.module.js';
import { PagosModule } from './modules/pagos/pagos.module.js';
import { PromocionesModule } from './modules/promociones/promociones.module.js';
import { ProbadorModule } from './modules/probador/probador.module.js';
import { ProveedoresModule } from './modules/proveedores/proveedores.module.js';
import { SaasModule } from './modules/saas/saas.module.js';
import { ReservasModule } from './modules/reservas/reservas.module.js';
import { SeguridadModule } from './modules/seguridad/seguridad.module.js';
import { SucursalesModule } from './modules/sucursales/sucursales.module.js';
import { VentasModule } from './modules/ventas/ventas.module.js';
import { IdempotenciaModule } from './core/security/idempotencia/idempotencia.module.js';
import { BiModule } from './modules/bi/bi.module.js';
import { MlModule } from './modules/ml/ml.module.js';

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

    // Módulos de negocio (uno por dominio, ver Database.md en el vault).
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
    ProbadorModule,
    // SaaS multi-tenant (Fase 1): registra el TenantInterceptor global.
    SaasModule,
    // Idempotencia y control concurrente (Fase 3): registra IdempotenciaInterceptor global.
    IdempotenciaModule,
    // BI y Dashboards especializados por rol (Fase 5).
    BiModule,
    // Machine Learning orientados a KPIs de Negocio (Fase 6).
    MlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  // Contexto de tienda por request (AsyncLocalStorage). Acá y no en main.ts
  // para que los e2e que montan AppModule también lo tengan.
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('{*path}');
  }
}
