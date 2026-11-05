import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from '../catalogo/catalogo.module.js';
import { ProveedoresModule } from '../proveedores/proveedores.module.js';
import { SeguridadModule } from '../seguridad/seguridad.module.js';
import { SucursalesModule } from '../sucursales/sucursales.module.js';
import { MiSuscripcionController } from './controller/mi-suscripcion.controller.js';
import { PlanesController } from './controller/planes.controller.js';
import { PlataformaController } from './controller/plataforma.controller.js';
import { TiendasController } from './controller/tiendas.controller.js';
import { Inquilino } from './entities/inquilino.entity.js';
import { Plan } from './entities/plan.entity.js';
import { Suscripcion } from './entities/suscripcion.entity.js';
import { AprovisionamientoService } from './service/aprovisionamiento.service.js';
import { InquilinosService } from './service/inquilinos.service.js';
import { MiSuscripcionService } from './service/mi-suscripcion.service.js';
import { PlanesService } from './service/planes.service.js';
import { ResolverTenantService } from './service/resolver-tenant.service.js';
import { SaasSeedService } from './service/saas-seed.service.js';
import { SuscripcionesService } from './service/suscripciones.service.js';
import { UsoPlanService } from './service/uso-plan.service.js';
import { TenantInterceptor } from './tenancy/tenant.interceptor.js';

/**
 * SaaS multi-tenant (Fase 1): planes, tiendas (inquilinos), suscripciones,
 * aprovisionamiento y el TenantInterceptor global. Ningún módulo importa este:
 * los límites del plan viajan en el contexto del request (core/tenancy).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, Inquilino, Suscripcion]),
    SeguridadModule,
    SucursalesModule,
    CatalogoModule,
    ProveedoresModule,
  ],
  controllers: [PlanesController, TiendasController, MiSuscripcionController, PlataformaController],
  providers: [
    PlanesService,
    InquilinosService,
    SuscripcionesService,
    AprovisionamientoService,
    UsoPlanService,
    ResolverTenantService,
    SaasSeedService,
    MiSuscripcionService,
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
  exports: [SuscripcionesService],
})
export class SaasModule {}
