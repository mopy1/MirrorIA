import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

/**
 * `JwtAuthGuard` (extends `AuthGuard('jwt')`) necesita `AuthModuleOptions`,
 * que solo existe donde `PassportModule` está registrado — sin esto, usar
 * `@UseGuards(JwtAuthGuard)` en un módulo que no sea `seguridad` explota con
 * `UnknownDependenciesException` en tiempo de arranque (Nest no puede
 * resolver la dependencia del guard). En vez de importar `PassportModule` en
 * cada módulo que necesite proteger un endpoint (repetitivo y frágil),
 * este módulo lo registra una sola vez como `@Global()` — se importa una
 * única vez en `AppModule` y queda disponible para cualquier controller de
 * cualquier módulo. La estrategia 'jwt' concreta sigue viviendo en
 * `modules/seguridad/security/jwt.strategy.ts` (única, registrada ahí porque
 * es la que conoce la entidad `Usuario`) — este módulo no la duplica, solo
 * expone la infraestructura de Passport que el guard necesita para inyectar.
 */
@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  exports: [PassportModule],
})
export class CoreSecurityModule {}
