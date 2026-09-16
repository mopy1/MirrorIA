import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

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
    // Ninguna tabla está en producción todavía (fase de desarrollo del examen) — sincronizar
    // el esquema desde las entidades es intencional acá, análogo a `ddl-auto=update` en el
    // erp-backend (Spring/JPA) hermano. Si el proyecto avanza más allá del examen, reemplazar
    // por migraciones (`typeorm migration:generate`) y apagar `synchronize`.
    synchronize: config.get<string>('NODE_ENV', 'development') !== 'production',
    logging: config.get<string>('NODE_ENV', 'development') === 'development',
  };
}
