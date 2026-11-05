import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TenantSubscriber } from '../tenancy/tenant.subscriber.js';

export function buildTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5435),
    username: config.get<string>('DB_USERNAME', 'mirroria'),
    password: config.get<string>('DB_PASSWORD', 'mirroria_password123'),
    database: config.get<string>('DB_NAME', 'mirroria_db'),
    autoLoadEntities: true,
    // ids con gen_random_uuid() (pgcrypto), no uuid_generate_v4() (ver base.entity.ts).
    uuidExtension: 'pgcrypto',
    // Completa tenant_id al insertar y frena updates cruzados (Fase 1 SaaS).
    subscribers: [TenantSubscriber],
    // Ninguna tabla está en producción todavía (fase de desarrollo del examen) — sincronizar
    // el esquema desde las entidades es intencional acá, análogo a `ddl-auto=update` en el
    // erp-backend (Spring/JPA) hermano. Si el proyecto avanza más allá del examen, reemplazar
    // por migraciones (`typeorm migration:generate`) y apagar `synchronize`.
    synchronize: config.get<string>('NODE_ENV', 'development') !== 'production',
    logging: config.get<string>('NODE_ENV', 'development') === 'development',
  };
}
