import { forwardRef, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from '../catalogo/catalogo.module.js';
import { PagosModule } from '../pagos/pagos.module.js';
import { ProveedoresModule } from '../proveedores/proveedores.module.js';
import { SeguridadModule } from '../seguridad/seguridad.module.js';
import { SucursalesModule } from '../sucursales/sucursales.module.js';
import { EstadisticasController } from './controller/estadisticas.controller.js';
import { MiMarcaController } from './controller/mi-marca.controller.js';
import { MiSuscripcionController } from './controller/mi-suscripcion.controller.js';
import { PaypalWebhookController } from './controller/paypal-webhook.controller.js';
import { PlanesController } from './controller/planes.controller.js';
import { PlataformaTiendasController } from './controller/plataforma-tiendas.controller.js';
import { PlataformaController } from './controller/plataforma.controller.js';
import { TiendasController } from './controller/tiendas.controller.js';
import { CobroSuscripcion } from './entities/cobro-suscripcion.entity.js';
import { EventoPlataforma } from './entities/evento-plataforma.entity.js';
import { Inquilino } from './entities/inquilino.entity.js';
import { MarcaTienda } from './entities/marca-tienda.entity.js';
import { Plan } from './entities/plan.entity.js';
import { Suscripcion } from './entities/suscripcion.entity.js';
import { AprovisionamientoService } from './service/aprovisionamiento.service.js';
import { CobrosSuscripcionService } from './service/cobros-suscripcion.service.js';
import { DashboardPlataformaService } from './service/dashboard-plataforma.service.js';
import { EstadisticasService } from './service/estadisticas.service.js';
import { EventosPlataformaService } from './service/eventos-plataforma.service.js';
import { InquilinosService } from './service/inquilinos.service.js';
import { MarcaService } from './service/marca.service.js';
import { MetricasTiendaService } from './service/metricas-tienda.service.js';
import { MiSuscripcionService } from './service/mi-suscripcion.service.js';
import { PlanesService } from './service/planes.service.js';
import { ResolverTenantService } from './service/resolver-tenant.service.js';
import { SaasSeedService } from './service/saas-seed.service.js';
import { SuscripcionesService } from './service/suscripciones.service.js';
import { TiendasPublicasService } from './service/tiendas-publicas.service.js';
import { UsoPlanService } from './service/uso-plan.service.js';
import { TenantInterceptor } from './tenancy/tenant.interceptor.js';

/**
 * SaaS multi-tenant (Fase 1 + 2): planes, tiendas (inquilinos), suscripciones,
 * cobros SaaS enchufables, aprovisionamiento y el TenantInterceptor global.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Inquilino,
      Suscripcion,
      MarcaTienda,
      EventoPlataforma,
      CobroSuscripcion,
    ]),
    SeguridadModule,
    SucursalesModule,
    CatalogoModule,
    ProveedoresModule,
    forwardRef(() => PagosModule),
  ],
  controllers: [
    PlanesController,
    TiendasController,
    EstadisticasController,
    MiSuscripcionController,
    PaypalWebhookController,
    MiMarcaController,
    PlataformaController,
    PlataformaTiendasController,
  ],
  providers: [
    PlanesService,
    InquilinosService,
    TiendasPublicasService,
    SuscripcionesService,
    CobrosSuscripcionService,
    AprovisionamientoService,
    UsoPlanService,
    ResolverTenantService,
    SaasSeedService,
    MiSuscripcionService,
    EventosPlataformaService,
    MarcaService,
    MetricasTiendaService,
    DashboardPlataformaService,
    EstadisticasService,
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
  exports: [SuscripcionesService, CobrosSuscripcionService, UsoPlanService, MiSuscripcionService],
})
export class SaasModule {}
