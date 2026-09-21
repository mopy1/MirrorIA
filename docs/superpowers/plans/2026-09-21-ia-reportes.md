# CU24 — Reportes dinámicos por IA — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo `ia` de MirrorIA: una pregunta en lenguaje natural se convierte en una consulta paramétrica sobre datos reales de negocio, y la respuesta vuelve narrada, auditable y registrada.

**Architecture:** El LLM **nunca escribe SQL**. Rellena una *ficha* estructurada (métrica, dimensión, filtros, comparación); un catálogo de métricas declarado como datos dice de qué tabla sale cada una, con qué joins y qué combinaciones admite; y un único constructor de consultas lee ese catálogo y arma SQL parametrizado de solo lectura. El módulo `ia` es el lado de lectura de CQRS: cruza tablas de otros módulos sin importar ninguna de sus entidades.

**Tech Stack:** NestJS 12 (ESM puro), TypeORM 1.x + PostgreSQL 16, class-validator, Vitest, Gemini (salida estructurada por esquema), React 19 + Tailwind v4 + shadcn/ui, Web Speech API.

**Spec:** `docs/superpowers/specs/2026-09-21-ia-reportes-design.md`

## Global Constraints

Copiadas del spec y de `mirroria-backend/AGENTS.md`. **Valen para todas las tareas.**

- **ESM puro:** todo import relativo dentro de `src/` termina en `.js`, aunque el archivo sea `.ts`. Los imports de paquetes npm van sin extensión. El build falla sin esto.
- **Ningún módulo de negocio importa entidades, servicios ni enums de otro módulo.** `ia` no importa `Venta`, `Cupon`, `RolUsuario` ni nada de `modules/*`. Accede a sus tablas por SQL, que es la excepción declarada en el spec §3.3.
- **`@Roles(...)` recibe strings literales** (`'ADMIN'`, `'ENCARGADO_SUCURSAL'`), nunca el enum `RolUsuario`.
- **Toda entidad extiende `core/database/base.entity.js`** (id uuid `gen_random_uuid()`, createdAt, updatedAt).
- **Toda excepción de negocio extiende `BusinessException`** (`core/exception/business.exception.js`). Nunca `HttpException` genérica desde un service.
- **Nunca exponer una `@Entity` desde un controller.** Solo DTOs.
- **Columna nullable de tipo string necesita `type: 'varchar'` explícito** en `@Column`, o TypeORM tira `DataTypeNotSupportedError`.
- **Todo SQL va parametrizado** (`$1`, `$2`, …). Jamás interpolar un valor del usuario en la cadena SQL. Los fragmentos SQL solo pueden venir del catálogo de métricas, nunca de la ficha.
- **`createdAt` y `updatedAt` son camelCase en la base y van SIEMPRE entre comillas dobles en SQL crudo:** `v."createdAt"`, nunca `v.created_at`. `BaseEntity` las declara con `@CreateDateColumn`/`@UpdateDateColumn` sin `name:`, y el proyecto no configura `namingStrategy`, así que TypeORM crea la columna con el nombre de la propiedad tal cual. Postgres pliega a minúsculas cualquier identificador sin comillas, de modo que `v.created_at` falla en tiempo de ejecución con `column does not exist` — y las pruebas con repositorio simulado **no lo detectan**. Verificado contra `information_schema` el 2026-09-21. El resto de las columnas sí llevan `name:` explícito y son snake_case (`total_cents`, `fecha_hora_prevista`, `full_name`, `fecha_pedido`, `fecha`).
- **Nada de secretos en el repo.** `IA_API_KEY` vive en `mirroria-backend/.env` (ignorado por `.gitignore:39`). En `.env.example` va vacía.
- Comandos: `npm test` (unitarias), `npm run test:e2e` (requiere Postgres arriba), `npm run lint` (oxlint).

---

## Estructura de archivos

**Backend — `mirroria-backend/src/modules/ia/`**

| Archivo | Responsabilidad |
|---|---|
| `ia.module.ts` | Wiring del módulo |
| `entities/interaccion-ia.entity.ts` | Tabla `interacciones_ia` |
| `dto/ficha-consulta.dto.ts` | La ficha + sus enums y validación |
| `dto/prompt.dto.ts` | `{ prompt: string }` |
| `dto/reporte-response.dto.ts` | `{ ficha, filas, comparacion, narrativa }` |
| `dto/interaccion-response.dto.ts` | Historial |
| `exception/combinacion-invalida.exception.ts` | 400 |
| `exception/consulta-no-comprendida.exception.ts` | 422 |
| `exception/ia-no-configurada.exception.ts` | 503 |
| `service/catalogo-metricas.ts` | **El corazón.** Las 18 métricas como datos |
| `service/motor-consulta.service.ts` | Ficha → SQL parametrizado → filas |
| `service/ia.service.ts` | Orquesta extraer → consultar → narrar → registrar |
| `service/proveedor-ia/proveedor-ia.interface.ts` | Contrato del LLM |
| `service/proveedor-ia/gemini.proveedor.ts` | Única implementación |
| `controller/ia.controller.ts` | Los 3 endpoints |

**Frontend — `mirroria-frontend/src/`**

| Archivo | Responsabilidad |
|---|---|
| `features/reports/types/reports.types.ts` | Tipos espejo de los DTOs |
| `features/reports/api/reportsApi.ts` | Llamadas sobre `apiFetch` |
| `features/reports/hooks/useDictado.ts` | Web Speech API encapsulada |
| `features/reports/components/tabla-reporte.tsx` | Render de filas y comparación |
| `features/admin/pages/ReportesAdminPage.tsx` | La pantalla |
| `routes/StaffRoute.tsx` | Guard nuevo: ADMIN **o** ENCARGADO_SUCURSAL |

**Modificados:** `app.module.ts` (ya importa `IaModule`, no hace falta tocarlo), `.env.example`, `App.tsx`, `layouts/admin-sidebar-content.tsx`.

---

## Orden de ejecución

Cuatro etapas. **Al final de cada etapa hay software que funciona**, no piezas a medias.

1. **Tareas 1-7** — motor andando de punta a punta con ventas e inventario, sin LLM.
2. **Tareas 8-13** — los otros cinco dominios y la comparación de períodos.
3. **Tareas 14-16** — la capa de LLM.
4. **Tareas 17-20** — la pantalla.

---

### Task 1: Entidad `InteraccionIa` y módulo `ia` conectado

Deja la tabla 22 de 23 creada y el módulo respirando. Sin esto no hay dónde registrar nada.

**Files:**
- Create: `mirroria-backend/src/modules/ia/entities/interaccion-ia.entity.ts`
- Modify: `mirroria-backend/src/modules/ia/ia.module.ts`
- Test: `mirroria-backend/src/modules/ia/entities/interaccion-ia.entity.spec.ts`

**Interfaces:**
- Produces: `InteraccionIa` (clase entidad), `TipoInteraccion` (enum con un valor: `REPORTE_VOZ`).

- [ ] **Step 1: Write the failing test**

```ts
// interaccion-ia.entity.spec.ts
import { describe, expect, it } from 'vitest';
import { getMetadataArgsStorage } from 'typeorm';
import { InteraccionIa, TipoInteraccion } from './interaccion-ia.entity.js';

describe('InteraccionIa', () => {
  it('mapea a la tabla interacciones_ia', () => {
    const tabla = getMetadataArgsStorage().tables.find((t) => t.target === InteraccionIa);
    expect(tabla?.name).toBe('interacciones_ia');
  });

  it('declara usuario_id, tipo, input_text y output_text', () => {
    const columnas = getMetadataArgsStorage()
      .columns.filter((c) => c.target === InteraccionIa)
      .map((c) => c.options.name);
    expect(columnas).toEqual(
      expect.arrayContaining(['usuario_id', 'tipo', 'input_text', 'output_text']),
    );
  });

  it('el unico tipo en alcance es REPORTE_VOZ', () => {
    expect(Object.values(TipoInteraccion)).toEqual(['REPORTE_VOZ']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mirroria-backend && npx vitest run src/modules/ia/entities/interaccion-ia.entity.spec.ts`
Expected: FAIL — `Cannot find module './interaccion-ia.entity.js'`

- [ ] **Step 3: Write minimal implementation**

```ts
// interaccion-ia.entity.ts
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

export enum TipoInteraccion {
  REPORTE_VOZ = 'REPORTE_VOZ',
}

/**
 * Log de CU24. `usuario_id` es columna simple sin relacion ORM (regla 1): apunta
 * a un ADMIN o ENCARGADO_SUCURSAL de `seguridad`, nunca a un CUSTOMER.
 * `output_text` queda nulo cuando la consulta no se pudo interpretar — una
 * pregunta no entendida tambien es dato.
 */
@Entity('interacciones_ia')
export class InteraccionIa extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId!: string;

  @Column({ type: 'varchar', length: 30, default: TipoInteraccion.REPORTE_VOZ })
  tipo!: TipoInteraccion;

  @Column({ name: 'input_text', type: 'text', nullable: true })
  inputText!: string | null;

  @Column({ name: 'output_text', type: 'text', nullable: true })
  outputText!: string | null;
}
```

Y el módulo:

```ts
// ia.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteraccionIa } from './entities/interaccion-ia.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([InteraccionIa])],
})
export class IaModule {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/entities/interaccion-ia.entity.spec.ts`
Expected: PASS (3 casos)

- [ ] **Step 5: Verificar que la tabla se crea de verdad**

Run: `cd .. && docker compose up -d postgres-db && cd mirroria-backend && npm run start:dev`
Con `synchronize: true`, en el log de arranque tiene que aparecer `CREATE TABLE "interacciones_ia"`. Confirmar con:
`docker exec -it $(docker ps -qf name=postgres-db) psql -U mirroria -d mirroria_db -c "\dt"` — deben verse **22** tablas.
Cortar el server con Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add src/modules/ia/
git commit -m "feat(ia): entidad InteraccionIa y modulo conectado"
```

---

### Task 2: Catálogo de métricas — el contrato de datos

El corazón del diseño. Sin lógica: solo tipos y una estructura. Todo lo demás lee de acá.

**Files:**
- Create: `mirroria-backend/src/modules/ia/service/catalogo-metricas.ts`
- Test: `mirroria-backend/src/modules/ia/service/catalogo-metricas.spec.ts`

**Interfaces:**
- Produces: `Metrica`, `Dimension`, `NombreFiltro`, `Dominio`, `DimensionSpec`, `DefinicionMetrica`, `CATALOGO_METRICAS: Record<Metrica, DefinicionMetrica>`, `METRICAS: readonly Metrica[]`.

- [ ] **Step 1: Write the failing test**

```ts
// catalogo-metricas.spec.ts
import { describe, expect, it } from 'vitest';
import { CATALOGO_METRICAS, METRICAS } from './catalogo-metricas.js';

describe('CATALOGO_METRICAS', () => {
  it('declara las metricas de ventas e inventario de la etapa 1', () => {
    expect(METRICAS).toEqual(
      expect.arrayContaining([
        'ingresos', 'unidades', 'cantidad_ventas', 'ticket_promedio', 'descuentos',
        'stock_disponible', 'stock_reservado', 'stock_en_transito',
      ]),
    );
  });

  it('las metricas de ventas filtran estado PAGADA por defecto', () => {
    expect(CATALOGO_METRICAS.ingresos.filtroEstadoPorDefecto).toBe("v.estado = 'PAGADA'");
  });

  it('las metricas de inventario no tienen columna de fecha ni admiten comparacion', () => {
    expect(CATALOGO_METRICAS.stock_disponible.columnaFecha).toBeNull();
    expect(CATALOGO_METRICAS.stock_disponible.permiteComparacion).toBe(false);
  });

  it('inventario no admite agrupar por dia ni por mes', () => {
    const dims = Object.keys(CATALOGO_METRICAS.stock_disponible.dimensiones);
    expect(dims).not.toContain('dia');
    expect(dims).not.toContain('mes');
  });

  it('toda metrica admite agrupar por ninguno', () => {
    for (const m of METRICAS) {
      expect(CATALOGO_METRICAS[m].dimensiones.ninguno).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/catalogo-metricas.spec.ts`
Expected: FAIL — módulo inexistente

- [ ] **Step 3: Write minimal implementation**

```ts
// catalogo-metricas.ts
export type Dominio = 'ventas' | 'inventario' | 'kardex' | 'reservas' | 'cupones' | 'compras' | 'clientes';

export type Metrica =
  | 'ingresos' | 'unidades' | 'cantidad_ventas' | 'ticket_promedio' | 'descuentos'
  | 'stock_disponible' | 'stock_reservado' | 'stock_en_transito';

export type Dimension =
  | 'sucursal' | 'categoria' | 'producto' | 'canal' | 'estado'
  | 'cliente' | 'cupon' | 'proveedor' | 'tipo_movimiento' | 'dia' | 'mes' | 'ninguno';

export type NombreFiltro =
  | 'sucursalId' | 'categoriaId' | 'productoId' | 'clienteId' | 'proveedorId'
  | 'canal' | 'estado' | 'tipoMovimiento';

/** Como alcanzar y etiquetar una dimension desde una metrica concreta. */
export interface DimensionSpec {
  /** Expresion SQL para GROUP BY y como clave de la fila. */
  grupo: string;
  /** Expresion SQL para el nombre legible que ve el usuario. */
  etiqueta: string;
  /** JOINs necesarios solo para esta dimension. */
  joins: string[];
}

export interface DefinicionMetrica {
  dominio: Dominio;
  /** Clausula FROM con alias, ej. 'ventas v'. */
  from: string;
  /** JOINs que la metrica necesita siempre, sin importar la dimension. */
  joinsBase: string[];
  /** Agregacion. Siempre envuelta en COALESCE: sin filas, el reporte dice 0, no null. */
  seleccion: string;
  /** Columna por la que filtran `desde`/`hasta`. null = la metrica no tiene tiempo. */
  columnaFecha: string | null;
  /** Filtro admitido -> expresion SQL comparable contra el parametro. */
  filtros: Partial<Record<NombreFiltro, string>>;
  dimensiones: Partial<Record<Dimension, DimensionSpec>>;
  /** Valores validos de `filtros.estado` para este dominio. null = no aplica. */
  estadoValido: readonly string[] | null;
  /** Se aplica salvo que la ficha pida un estado explicito. Ver spec 3.2. */
  filtroEstadoPorDefecto: string | null;
  permiteComparacion: boolean;
}

const ESTADOS_VENTA = [
  'PENDIENTE', 'PAGADA', 'ENTREGADA', 'CANCELADA', 'DEVUELTA_PARCIAL', 'DEVUELTA_TOTAL',
] as const;

/** venta_items -> variantes -> productos, el camino de ventas hacia el catalogo. */
const JOIN_VENTA_ITEMS = 'JOIN venta_items vi ON vi.venta_id = v.id';
const JOIN_PRODUCTO_DESDE_VI =
  'JOIN variantes_producto vp ON vp.id = vi.variante_id JOIN productos p ON p.id = vp.producto_id';
/** inventario_sucursal -> variantes -> productos. */
const JOIN_PRODUCTO_DESDE_INV =
  'JOIN variantes_producto vp ON vp.id = i.variante_id JOIN productos p ON p.id = vp.producto_id';

const DIM_NINGUNO: DimensionSpec = { grupo: "'total'", etiqueta: "'Total'", joins: [] };

/** Dimensiones comunes a las metricas cuyo FROM es `ventas v`. */
function dimensionesDeVentas(): Partial<Record<Dimension, DimensionSpec>> {
  return {
    ninguno: DIM_NINGUNO,
    sucursal: {
      grupo: 'v.sucursal_id',
      etiqueta: 's.nombre',
      joins: ['JOIN sucursales s ON s.id = v.sucursal_id'],
    },
    canal: { grupo: 'v.canal', etiqueta: 'v.canal', joins: [] },
    estado: { grupo: 'v.estado', etiqueta: 'v.estado', joins: [] },
    dia: {
      grupo: "date_trunc('day', v."createdAt")",
      etiqueta: "to_char(date_trunc('day', v."createdAt"), 'YYYY-MM-DD')",
      joins: [],
    },
    mes: {
      grupo: "date_trunc('month', v."createdAt")",
      etiqueta: "to_char(date_trunc('month', v."createdAt"), 'YYYY-MM')",
      joins: [],
    },
    categoria: {
      grupo: 'c.id',
      etiqueta: 'c.nombre',
      joins: [JOIN_VENTA_ITEMS, JOIN_PRODUCTO_DESDE_VI, 'JOIN categorias c ON c.id = p.categoria_id'],
    },
    producto: {
      grupo: 'p.id',
      etiqueta: 'p.titulo',
      joins: [JOIN_VENTA_ITEMS, JOIN_PRODUCTO_DESDE_VI],
    },
  };
}

const FILTROS_VENTAS: Partial<Record<NombreFiltro, string>> = {
  sucursalId: 'v.sucursal_id = $',
  canal: 'v.canal = $',
  estado: 'v.estado = $',
  clienteId: 'v.cliente_id = $',
};

export const CATALOGO_METRICAS: Record<Metrica, DefinicionMetrica> = {
  ingresos: {
    dominio: 'ventas',
    from: 'ventas v',
    joinsBase: [],
    seleccion: 'COALESCE(SUM(v.total_cents), 0)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS,
    dimensiones: dimensionesDeVentas(),
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  },
  cantidad_ventas: {
    dominio: 'ventas',
    from: 'ventas v',
    joinsBase: [],
    seleccion: 'COUNT(DISTINCT v.id)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS,
    dimensiones: dimensionesDeVentas(),
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  },
  ticket_promedio: {
    dominio: 'ventas',
    from: 'ventas v',
    joinsBase: [],
    seleccion: 'COALESCE(ROUND(AVG(v.total_cents)), 0)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS,
    dimensiones: dimensionesDeVentas(),
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  },
  descuentos: {
    dominio: 'ventas',
    from: 'ventas v',
    joinsBase: [],
    seleccion: 'COALESCE(SUM(v.descuento_cents), 0)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS,
    dimensiones: dimensionesDeVentas(),
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  },
  // `unidades` suma cantidades de items: necesita el join a venta_items SIEMPRE,
  // no solo cuando la dimension lo pide.
  unidades: {
    dominio: 'ventas',
    from: 'ventas v',
    joinsBase: [JOIN_VENTA_ITEMS],
    seleccion: 'COALESCE(SUM(vi.cantidad), 0)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS,
    dimensiones: {
      ...dimensionesDeVentas(),
      // El join a venta_items ya esta en joinsBase; declararlo de nuevo lo duplicaria.
      categoria: {
        grupo: 'c.id',
        etiqueta: 'c.nombre',
        joins: [JOIN_PRODUCTO_DESDE_VI, 'JOIN categorias c ON c.id = p.categoria_id'],
      },
      producto: { grupo: 'p.id', etiqueta: 'p.titulo', joins: [JOIN_PRODUCTO_DESDE_VI] },
    },
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  },
  stock_disponible: definicionInventario('COALESCE(SUM(i.cantidad_disponible), 0)'),
  stock_reservado: definicionInventario('COALESCE(SUM(i.cantidad_reservada), 0)'),
  stock_en_transito: definicionInventario('COALESCE(SUM(i.cantidad_en_transito), 0)'),
};

/**
 * Inventario es una foto del presente: `inventario_sucursal` no guarda historia.
 * Por eso no tiene columnaFecha, no admite dia/mes y no permite comparacion.
 * Para la evolucion en el tiempo esta el kardex (Task 8).
 */
function definicionInventario(seleccion: string): DefinicionMetrica {
  return {
    dominio: 'inventario',
    from: 'inventario_sucursal i',
    joinsBase: [],
    seleccion,
    columnaFecha: null,
    filtros: { sucursalId: 'i.sucursal_id = $' },
    dimensiones: {
      ninguno: DIM_NINGUNO,
      sucursal: {
        grupo: 'i.sucursal_id',
        etiqueta: 's.nombre',
        joins: ['JOIN sucursales s ON s.id = i.sucursal_id'],
      },
      categoria: {
        grupo: 'c.id',
        etiqueta: 'c.nombre',
        joins: [JOIN_PRODUCTO_DESDE_INV, 'JOIN categorias c ON c.id = p.categoria_id'],
      },
      producto: { grupo: 'p.id', etiqueta: 'p.titulo', joins: [JOIN_PRODUCTO_DESDE_INV] },
    },
    estadoValido: null,
    filtroEstadoPorDefecto: null,
    permiteComparacion: false,
  };
}

export const METRICAS = Object.keys(CATALOGO_METRICAS) as readonly Metrica[];
```

> **Nota para quien implementa:** `function definicionInventario` se usa antes de su declaración en el objeto literal. En JavaScript las declaraciones de función se elevan (hoisting), así que esto funciona. Si oxlint se queja, moverla arriba del `CATALOGO_METRICAS`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/service/catalogo-metricas.spec.ts`
Expected: PASS (5 casos)

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: sin errores en `src/modules/ia/`

- [ ] **Step 6: Commit**

```bash
git add src/modules/ia/service/catalogo-metricas.ts src/modules/ia/service/catalogo-metricas.spec.ts
git commit -m "feat(ia): catalogo de metricas de ventas e inventario"
```

---

### Task 3: La ficha (DTO) y su validación

**Files:**
- Create: `mirroria-backend/src/modules/ia/dto/ficha-consulta.dto.ts`
- Create: `mirroria-backend/src/modules/ia/exception/combinacion-invalida.exception.ts`
- Test: `mirroria-backend/src/modules/ia/dto/ficha-consulta.dto.spec.ts`

**Interfaces:**
- Consumes: `Metrica`, `Dimension` de `catalogo-metricas.js`
- Produces: `FichaConsultaDto`, `FiltrosDto`, `RangoDto`, `CombinacionInvalidaException`

- [ ] **Step 1: Write the failing test**

```ts
// ficha-consulta.dto.spec.ts
import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { FichaConsultaDto } from './ficha-consulta.dto.js';

function validar(payload: unknown) {
  return validateSync(plainToInstance(FichaConsultaDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

describe('FichaConsultaDto', () => {
  it('acepta una ficha minima valida', () => {
    expect(validar({ metrica: 'ingresos', agruparPor: 'sucursal' })).toHaveLength(0);
  });

  it('rechaza una metrica inexistente', () => {
    expect(validar({ metrica: 'ingresos_falsos', agruparPor: 'sucursal' }).length).toBeGreaterThan(0);
  });

  it('rechaza limite fuera de rango', () => {
    expect(validar({ metrica: 'ingresos', agruparPor: 'ninguno', limite: 500 }).length).toBeGreaterThan(0);
    expect(validar({ metrica: 'ingresos', agruparPor: 'ninguno', limite: 0 }).length).toBeGreaterThan(0);
  });

  it('rechaza un uuid mal formado en los filtros', () => {
    expect(
      validar({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { sucursalId: 'no-soy-uuid' } }).length,
    ).toBeGreaterThan(0);
  });

  it('rechaza propiedades desconocidas: la ficha es cerrada', () => {
    expect(validar({ metrica: 'ingresos', agruparPor: 'ninguno', sqlCrudo: 'DROP TABLE ventas' }).length)
      .toBeGreaterThan(0);
  });

  it('aplica los valores por defecto de orden y limite', () => {
    const ficha = plainToInstance(FichaConsultaDto, { metrica: 'ingresos', agruparPor: 'ninguno' });
    expect(ficha.orden).toBe('desc');
    expect(ficha.limite).toBe(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/dto/ficha-consulta.dto.spec.ts`
Expected: FAIL — módulo inexistente

- [ ] **Step 3: Write minimal implementation**

```ts
// combinacion-invalida.exception.ts
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class CombinacionInvalidaException extends BusinessException {
  constructor(detalle: string) {
    super(`Combinacion invalida: ${detalle}`, HttpStatus.BAD_REQUEST);
  }
}
```

```ts
// ficha-consulta.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, Min, ValidateNested,
} from 'class-validator';
import { type Dimension, type Metrica, METRICAS } from '../service/catalogo-metricas.js';

const DIMENSIONES: Dimension[] = [
  'sucursal', 'categoria', 'producto', 'canal', 'estado',
  'cliente', 'cupon', 'proveedor', 'tipo_movimiento', 'dia', 'mes', 'ninguno',
];

export class FiltrosDto {
  @ApiPropertyOptional() @IsOptional() @IsISO8601() desde?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() hasta?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sucursalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoriaId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() productoId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() clienteId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() proveedorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() canal?: string;
  /** Validado contra el dominio de la metrica en el motor, no aca. */
  @ApiPropertyOptional() @IsOptional() @IsString() estado?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tipoMovimiento?: string;
}

export class RangoDto {
  @ApiProperty() @IsISO8601() desde!: string;
  @ApiProperty() @IsISO8601() hasta!: string;
}

/**
 * El contrato que rellena el LLM. Es CERRADA a proposito
 * (`forbidNonWhitelisted` en el ValidationPipe global): cualquier propiedad
 * que el modelo invente es 400, no algo que llegue a la base.
 */
export class FichaConsultaDto {
  @ApiProperty({ enum: METRICAS })
  @IsIn(METRICAS)
  metrica!: Metrica;

  @ApiProperty({ enum: DIMENSIONES })
  @IsIn(DIMENSIONES)
  agruparPor!: Dimension;

  @ApiPropertyOptional({ type: FiltrosDto })
  @IsOptional() @ValidateNested() @Type(() => FiltrosDto)
  filtros: FiltrosDto = {};

  /** Solo metricas de reservas. Ver spec 4-bis.2. */
  @ApiPropertyOptional({ enum: ['creacion', 'prevista'] })
  @IsOptional() @IsIn(['creacion', 'prevista'])
  campoFecha?: 'creacion' | 'prevista';

  @ApiPropertyOptional({ type: RangoDto })
  @IsOptional() @ValidateNested() @Type(() => RangoDto)
  compararCon?: RangoDto;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional() @IsIn(['asc', 'desc'])
  orden: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional() @IsInt() @Min(1) @Max(100)
  limite: number = 20;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/dto/ficha-consulta.dto.spec.ts`
Expected: PASS (6 casos)

- [ ] **Step 5: Commit**

```bash
git add src/modules/ia/dto/ src/modules/ia/exception/
git commit -m "feat(ia): ficha de consulta cerrada y validada"
```

---

### Task 4: Motor de consulta — métricas de ventas

El constructor de SQL. **Ninguna rama por métrica**: lee el catálogo.

**Files:**
- Create: `mirroria-backend/src/modules/ia/service/motor-consulta.service.ts`
- Test: `mirroria-backend/src/modules/ia/service/motor-consulta.service.spec.ts`

**Interfaces:**
- Consumes: `CATALOGO_METRICAS`, `FichaConsultaDto`, `CombinacionInvalidaException`
- Produces: `MotorConsultaService` con `ejecutar(ficha: FichaConsultaDto): Promise<FilaReporte[]>` y `FilaReporte = { clave: string; etiqueta: string; valor: number }`

- [ ] **Step 1: Write the failing test**

```ts
// motor-consulta.service.spec.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { MotorConsultaService } from './motor-consulta.service.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';

function ficha(p: Partial<FichaConsultaDto>): FichaConsultaDto {
  return plainToInstance(FichaConsultaDto, { filtros: {}, orden: 'desc', limite: 20, ...p });
}

describe('MotorConsultaService', () => {
  let query: ReturnType<typeof vi.fn>;
  let service: MotorConsultaService;

  beforeEach(() => {
    query = vi.fn().mockResolvedValue([{ clave: 'x', etiqueta: 'Santa Cruz', valor: '150000' }]);
    service = new MotorConsultaService({ query } as unknown as DataSource);
  });

  const sqlDeLaLlamada = () => String(query.mock.calls[0][0]);
  const paramsDeLaLlamada = () => query.mock.calls[0][1] as unknown[];

  it('suma total_cents agrupando por sucursal', async () => {
    await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'sucursal' }));
    expect(sqlDeLaLlamada()).toContain('COALESCE(SUM(v.total_cents), 0)');
    expect(sqlDeLaLlamada()).toContain('JOIN sucursales s ON s.id = v.sucursal_id');
    expect(sqlDeLaLlamada()).toContain('GROUP BY');
  });

  it('aplica estado PAGADA por defecto', async () => {
    await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno' }));
    expect(sqlDeLaLlamada()).toContain("v.estado = 'PAGADA'");
  });

  it('un estado explicito reemplaza al de por defecto, no se suma', async () => {
    await service.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { estado: 'CANCELADA' } }),
    );
    expect(sqlDeLaLlamada()).not.toContain("v.estado = 'PAGADA'");
    expect(paramsDeLaLlamada()).toContain('CANCELADA');
  });

  it('rechaza un estado que no existe en el dominio de la metrica', async () => {
    await expect(
      service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { estado: 'INVENTADO' } })),
    ).rejects.toThrow(CombinacionInvalidaException);
  });

  it('parametriza las fechas, nunca las interpola', async () => {
    await service.ejecutar(
      ficha({ metrica: 'ingresos', agruparPor: 'mes', filtros: { desde: '2026-08-01', hasta: '2026-08-31' } }),
    );
    expect(sqlDeLaLlamada()).toContain('v."createdAt" >= $');
    expect(paramsDeLaLlamada()).toContain('2026-08-01');
  });

  it('rechaza agrupar stock por dia', async () => {
    await expect(
      service.ejecutar(ficha({ metrica: 'stock_disponible', agruparPor: 'dia' })),
    ).rejects.toThrow(CombinacionInvalidaException);
  });

  it('rechaza un filtro que la metrica no admite', async () => {
    await expect(
      service.ejecutar(ficha({ metrica: 'stock_disponible', agruparPor: 'ninguno', filtros: { canal: 'WEB' } })),
    ).rejects.toThrow(CombinacionInvalidaException);
  });

  it('devuelve el valor como numero, no como el string que da el driver pg', async () => {
    const filas = await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'sucursal' }));
    expect(filas[0].valor).toBe(150000);
    expect(typeof filas[0].valor).toBe('number');
  });

  it('no duplica un join que ya esta en joinsBase', async () => {
    await service.ejecutar(ficha({ metrica: 'unidades', agruparPor: 'producto' }));
    const ocurrencias = sqlDeLaLlamada().split('JOIN venta_items vi').length - 1;
    expect(ocurrencias).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/motor-consulta.service.spec.ts`
Expected: FAIL — módulo inexistente

- [ ] **Step 3: Write minimal implementation**

```ts
// motor-consulta.service.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
import {
  CATALOGO_METRICAS, type DefinicionMetrica, type NombreFiltro,
} from './catalogo-metricas.js';

export interface FilaReporte {
  clave: string;
  etiqueta: string;
  valor: number;
}

/** Filtros que no salen del mapa `filtros` del catalogo: los maneja el motor. */
const FILTROS_DE_FECHA: NombreFiltro[] = [];

@Injectable()
export class MotorConsultaService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async ejecutar(ficha: FichaConsultaDto, rango?: { desde: string; hasta: string }): Promise<FilaReporte[]> {
    const def = CATALOGO_METRICAS[ficha.metrica];
    const dim = def.dimensiones[ficha.agruparPor];
    if (!dim) {
      throw new CombinacionInvalidaException(
        `la metrica "${ficha.metrica}" no se puede agrupar por "${ficha.agruparPor}"`,
      );
    }

    const params: unknown[] = [];
    const condiciones: string[] = [];
    const filtros = ficha.filtros ?? {};

    // 1. Filtros declarados en el catalogo.
    for (const [nombre, valor] of Object.entries(filtros)) {
      if (valor === undefined || nombre === 'desde' || nombre === 'hasta') continue;
      const plantilla = def.filtros[nombre as NombreFiltro];
      if (!plantilla) {
        throw new CombinacionInvalidaException(
          `la metrica "${ficha.metrica}" no admite el filtro "${nombre}"`,
        );
      }
      if (nombre === 'estado' && def.estadoValido && !def.estadoValido.includes(String(valor))) {
        throw new CombinacionInvalidaException(
          `"${String(valor)}" no es un estado valido para "${ficha.metrica}"`,
        );
      }
      params.push(valor);
      condiciones.push(plantilla.replace('$', `$${params.length}`));
    }

    // 2. Estado por defecto: solo si la ficha no pidio uno.
    if (def.filtroEstadoPorDefecto && filtros.estado === undefined) {
      condiciones.push(def.filtroEstadoPorDefecto);
    }

    // 3. Rango de fechas. `rango` (comparacion) pisa al de los filtros.
    const desde = rango?.desde ?? filtros.desde;
    const hasta = rango?.hasta ?? filtros.hasta;
    if ((desde || hasta) && !def.columnaFecha) {
      throw new CombinacionInvalidaException(
        `la metrica "${ficha.metrica}" no tiene dimension temporal: no admite filtro de fechas`,
      );
    }
    if (desde && def.columnaFecha) {
      params.push(desde);
      condiciones.push(`${def.columnaFecha} >= $${params.length}`);
    }
    if (hasta && def.columnaFecha) {
      params.push(hasta);
      condiciones.push(`${def.columnaFecha} <= $${params.length}`);
    }

    // 4. Joins, sin duplicar.
    const joins = [...new Set([...def.joinsBase, ...dim.joins])];

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const agrupa = ficha.agruparPor === 'ninguno' ? '' : `GROUP BY ${dim.grupo}, ${dim.etiqueta}`;

    params.push(ficha.limite);
    const sql = `
      SELECT ${dim.grupo}::text AS clave, ${dim.etiqueta}::text AS etiqueta, ${def.seleccion} AS valor
      FROM ${def.from}
      ${joins.join('\n      ')}
      ${where}
      ${agrupa}
      ORDER BY valor ${ficha.orden === 'asc' ? 'ASC' : 'DESC'}
      LIMIT $${params.length}
    `;

    const filas = (await this.dataSource.query(sql, params)) as Array<Record<string, string>>;
    return filas.map((f) => ({
      clave: f.clave ?? '',
      etiqueta: f.etiqueta ?? '',
      // El driver pg devuelve bigint/numeric como string. Ver AGENTS.md, productos.precioCents.
      valor: Number(f.valor),
    }));
  }
}
```

> **Nota:** `FILTROS_DE_FECHA` queda declarado vacío a propósito — `desde`/`hasta` se saltean en el bucle del paso 1 y se manejan en el paso 3. Si oxlint marca la constante como no usada, borrarla.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/service/motor-consulta.service.spec.ts`
Expected: PASS (9 casos)

- [ ] **Step 5: Commit**

```bash
git add src/modules/ia/service/motor-consulta.service.ts src/modules/ia/service/motor-consulta.service.spec.ts
git commit -m "feat(ia): motor de consulta parametrica leyendo el catalogo"
```

---

### Task 5: Endpoint `POST /ia/reportes/consulta` con guards y forzado de sucursal

Cierra la etapa 1: sin LLM, pero el reporte ya funciona de punta a punta.

**Files:**
- Create: `mirroria-backend/src/modules/ia/dto/reporte-response.dto.ts`
- Create: `mirroria-backend/src/modules/ia/controller/ia.controller.ts`
- Create: `mirroria-backend/src/modules/ia/service/ia.service.ts`
- Modify: `mirroria-backend/src/modules/ia/ia.module.ts`
- Test: `mirroria-backend/src/modules/ia/service/ia.service.spec.ts`

**Interfaces:**
- Consumes: `MotorConsultaService.ejecutar`, `JwtAuthGuard`, `RolesGuard`, `@Roles`, `@CurrentUser`
- Produces: `IaService.consultar(ficha, user): Promise<ReporteResponseDto>`, `ReporteResponseDto = { ficha, filas, comparacion: null, narrativa: string | null }`

- [ ] **Step 1: Write the failing test**

```ts
// ia.service.spec.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { IaService } from './ia.service.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import type { MotorConsultaService } from './motor-consulta.service.js';

const SUCURSAL_PROPIA = '11111111-1111-1111-1111-111111111111';
const SUCURSAL_AJENA = '22222222-2222-2222-2222-222222222222';

function ficha(p: Partial<FichaConsultaDto>): FichaConsultaDto {
  return plainToInstance(FichaConsultaDto, { filtros: {}, orden: 'desc', limite: 20, ...p });
}

describe('IaService.consultar', () => {
  let motor: { ejecutar: ReturnType<typeof vi.fn> };
  let service: IaService;

  beforeEach(() => {
    motor = { ejecutar: vi.fn().mockResolvedValue([{ clave: 'x', etiqueta: 'Total', valor: 42 }]) };
    service = new IaService(motor as unknown as MotorConsultaService);
  });

  it('un ADMIN consulta la sucursal que pida', async () => {
    await service.consultar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { sucursalId: SUCURSAL_AJENA } }),
      { sub: 'u1', role: 'ADMIN', sucursalId: SUCURSAL_PROPIA },
    );
    expect(motor.ejecutar.mock.calls[0][0].filtros.sucursalId).toBe(SUCURSAL_AJENA);
  });

  it('a un ENCARGADO_SUCURSAL se le fuerza su propia sucursal', async () => {
    await service.consultar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { sucursalId: SUCURSAL_AJENA } }),
      { sub: 'u2', role: 'ENCARGADO_SUCURSAL', sucursalId: SUCURSAL_PROPIA },
    );
    expect(motor.ejecutar.mock.calls[0][0].filtros.sucursalId).toBe(SUCURSAL_PROPIA);
  });

  it('un ENCARGADO_SUCURSAL sin sucursal asignada no ve nada de otras', async () => {
    await service.consultar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { sucursalId: SUCURSAL_AJENA } }),
      { sub: 'u3', role: 'ENCARGADO_SUCURSAL', sucursalId: null },
    );
    expect(motor.ejecutar.mock.calls[0][0].filtros.sucursalId).toBeUndefined();
  });

  it('devuelve las filas del motor y narrativa nula sin LLM', async () => {
    const res = await service.consultar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno' }),
      { sub: 'u1', role: 'ADMIN', sucursalId: null },
    );
    expect(res.filas).toHaveLength(1);
    expect(res.narrativa).toBeNull();
    expect(res.comparacion).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/ia.service.spec.ts`
Expected: FAIL — módulo inexistente

- [ ] **Step 3: Write minimal implementation**

```ts
// reporte-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { FichaConsultaDto } from './ficha-consulta.dto.js';
import type { FilaReporte } from '../service/motor-consulta.service.js';

export class ReporteResponseDto {
  /** La ficha ya interpretada: el usuario ve COMO se entendio su pregunta. */
  @ApiProperty({ type: FichaConsultaDto })
  ficha!: FichaConsultaDto;

  @ApiProperty()
  filas!: FilaReporte[];

  @ApiProperty({ nullable: true })
  comparacion!: unknown | null;

  @ApiProperty({ nullable: true })
  narrativa!: string | null;
}
```

```ts
// ia.service.ts
import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import { MotorConsultaService } from './motor-consulta.service.js';

@Injectable()
export class IaService {
  constructor(private readonly motor: MotorConsultaService) {}

  /**
   * Corre una ficha ya armada. Sin LLM: es la via que usan las pruebas y la que
   * sigue funcionando cuando no hay IA_API_KEY.
   *
   * Un ENCARGADO_SUCURSAL queda encerrado en su sucursal: se le pisa el filtro
   * con la del JWT. Sin esto pregunta por otra sucursal y el sistema le contesta.
   */
  async consultar(ficha: FichaConsultaDto, user: JwtPayload): Promise<ReporteResponseDto> {
    const fichaEfectiva = this.forzarAlcance(ficha, user);
    const filas = await this.motor.ejecutar(fichaEfectiva);
    return { ficha: fichaEfectiva, filas, comparacion: null, narrativa: null };
  }

  private forzarAlcance(ficha: FichaConsultaDto, user: JwtPayload): FichaConsultaDto {
    if (user.role !== 'ENCARGADO_SUCURSAL') return ficha;
    return {
      ...ficha,
      filtros: { ...ficha.filtros, sucursalId: user.sucursalId ?? undefined },
    } as FichaConsultaDto;
  }
}
```

> **Antes de escribir esto:** abrir `src/core/security/jwt-payload.interface.ts` y confirmar los nombres reales de los campos (`sub`, `role`, `sucursalId`). Si difieren, ajustar el test y el servicio a los nombres reales — no al revés.

```ts
// ia.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import { IaService } from '../service/ia.service.js';

@ApiTags('IA')
@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('reportes/consulta')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Ejecutar una ficha de consulta ya armada (sin IA)' })
  consulta(
    @Body() ficha: FichaConsultaDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReporteResponseDto> {
    return this.iaService.consultar(ficha, user);
  }
}
```

```ts
// ia.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IaController } from './controller/ia.controller.js';
import { InteraccionIa } from './entities/interaccion-ia.entity.js';
import { IaService } from './service/ia.service.js';
import { MotorConsultaService } from './service/motor-consulta.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InteraccionIa])],
  controllers: [IaController],
  providers: [IaService, MotorConsultaService],
})
export class IaModule {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/`
Expected: PASS — todas las suites del módulo

- [ ] **Step 5: Probar a mano contra Postgres real**

```bash
cd .. && docker compose up -d postgres-db && cd mirroria-backend && npm run start:dev
```

En otra terminal, con un token de ADMIN (sacarlo de `POST /api/v1/seguridad/auth/login`):

```bash
curl -s -X POST http://localhost:3000/api/v1/ia/reportes/consulta \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"metrica":"ingresos","agruparPor":"sucursal"}'
```

Expected: 200 con `{ ficha, filas, comparacion: null, narrativa: null }`. Sin token: 401.

- [ ] **Step 6: Commit**

```bash
git add src/modules/ia/
git commit -m "feat(ia): endpoint de consulta con guards y alcance por sucursal"
```

---

### Task 6: e2e del endpoint contra Postgres real

**Files:**
- Create: `mirroria-backend/test/ia.e2e-spec.ts`

**Interfaces:**
- Consumes: `AppModule`, el endpoint de Task 5.

- [ ] **Step 1: Write the failing test**

```ts
// test/ia.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

const RUTA = '/api/v1/ia/reportes/consulta';

/** Registra un usuario nuevo y devuelve su token. El registro publico siempre da CUSTOMER. */
async function tokenDeCustomer(app: INestApplication<App>): Promise<string> {
  const email = `ia-e2e-${Date.now()}@test.com`;
  const res = await request(app.getHttpServer())
    .post('/api/v1/seguridad/auth/register')
    .send({ email, password: 'Password123', fullName: 'E2E IA' })
    .expect(201);
  return (res.body as { accessToken: string }).accessToken;
}

describe('IA - reportes (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sin token devuelve 401', async () => {
    await request(app.getHttpServer())
      .post(RUTA)
      .send({ metrica: 'ingresos', agruparPor: 'ninguno' })
      .expect(401);
  });

  it('un CUSTOMER devuelve 403', async () => {
    const token = await tokenDeCustomer(app);
    await request(app.getHttpServer())
      .post(RUTA)
      .set('Authorization', `Bearer ${token}`)
      .send({ metrica: 'ingresos', agruparPor: 'ninguno' })
      .expect(403);
  });

  it('una ficha con propiedades inventadas devuelve 400', async () => {
    const token = await tokenDeCustomer(app);
    await request(app.getHttpServer())
      .post(RUTA)
      .set('Authorization', `Bearer ${token}`)
      .send({ metrica: 'ingresos', agruparPor: 'ninguno', sqlCrudo: 'DROP TABLE ventas' })
      .expect(400);
  });
});
```

> **Sobre el 200 de ADMIN:** el registro público solo crea `CUSTOMER`, así que para probar el camino feliz hay que promover el usuario. Hacerlo en el propio test con una query directa sobre la conexión de la app:
> `await app.get(DataSource).query("UPDATE usuarios SET role='ADMIN' WHERE email=$1", [email])`,
> y **volver a hacer login** para obtener un token con el rol nuevo (el JWT lleva el rol firmado). Agregar ese caso como cuarto `it`, esperando 200 y `body.filas` definido.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .. && docker compose up -d postgres-db && cd mirroria-backend && npm run test:e2e`
Expected: FAIL en los casos nuevos

- [ ] **Step 3: Implementar el cuarto caso (ADMIN → 200)**

Seguir la nota del Step 1. No hay código de producción que escribir: si los guards y el motor están bien, pasa.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:e2e`
Expected: PASS — 4 casos, más el `app.e2e-spec.ts` que ya existía

- [ ] **Step 5: Commit**

```bash
git add test/ia.e2e-spec.ts
git commit -m "test(ia): e2e de permisos y validacion del endpoint de reportes"
```

---

### Task 7: Cierre de la etapa 1

- [ ] **Step 1: Suite completa**

Run: `npm test && npm run test:e2e && npm run lint`
Expected: todo en verde. Anotar el total de pruebas.

- [ ] **Step 2: Confirmar las 22 tablas**

Run: `docker exec -it $(docker ps -qf name=postgres-db) psql -U mirroria -d mirroria_db -c "\dt" | wc -l`
Expected: `interacciones_ia` presente.

- [ ] **Step 3: Commit de cierre**

```bash
git commit --allow-empty -m "chore(ia): etapa 1 cerrada - ventas e inventario de punta a punta"
```

---

## Etapa 2 — Los otros cinco dominios y la comparación

Cada tarea agrega entradas al catálogo y sus pruebas. **El motor no se toca** salvo en
Tasks 9 y 13: si hiciera falta tocarlo para agregar una métrica, el catálogo estaría mal
diseñado.

---

### Task 8: Métricas de kardex

El kardex es lo histórico que inventario no puede dar: `movimientos_inventario` sí tiene
línea de tiempo.

**Files:**
- Modify: `mirroria-backend/src/modules/ia/service/catalogo-metricas.ts`
- Test: `mirroria-backend/src/modules/ia/service/catalogo-metricas.spec.ts` (agregar `describe`)

**Interfaces:**
- Consumes: `DefinicionMetrica`, `DIM_NINGUNO` de Task 2
- Produces: métricas `movimientos_unidades` y `movimientos_conteo`; dimensión `tipo_movimiento`; `TIPOS_MOVIMIENTO` exportado para Task 14.

- [ ] **Step 1: Write the failing test**

```ts
// agregar en catalogo-metricas.spec.ts
describe('metricas de kardex', () => {
  it('filtran por la columna fecha propia, no por created_at', () => {
    expect(CATALOGO_METRICAS.movimientos_unidades.columnaFecha).toBe('m.fecha');
  });

  it('admiten agrupar por tipo_movimiento', () => {
    expect(CATALOGO_METRICAS.movimientos_unidades.dimensiones.tipo_movimiento).toBeDefined();
  });

  it('las metricas de ventas NO admiten tipo_movimiento', () => {
    expect(CATALOGO_METRICAS.ingresos.dimensiones.tipo_movimiento).toBeUndefined();
  });

  it('no tienen estado por defecto: un movimiento no tiene estado', () => {
    expect(CATALOGO_METRICAS.movimientos_unidades.filtroEstadoPorDefecto).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/catalogo-metricas.spec.ts`
Expected: FAIL — `movimientos_unidades` no existe en el catálogo

- [ ] **Step 3: Write minimal implementation**

Agregar a `Metrica` los valores `'movimientos_unidades' | 'movimientos_conteo'`, y esto al archivo:

```ts
export const TIPOS_MOVIMIENTO = [
  'RESERVA', 'LIBERACION_RESERVA', 'VENTA', 'DEVOLUCION', 'RECEPCION_PROVEEDOR', 'AJUSTE',
] as const;

const JOIN_PRODUCTO_DESDE_MOV =
  'JOIN variantes_producto vp ON vp.id = m.variante_id JOIN productos p ON p.id = vp.producto_id';

function definicionKardex(seleccion: string): DefinicionMetrica {
  return {
    dominio: 'kardex',
    from: 'movimientos_inventario m',
    joinsBase: [],
    seleccion,
    // `movimientos_inventario` tiene columna `fecha` propia, distinta del
    // created_at que hereda de BaseEntity. Ver spec 4-bis.3.
    columnaFecha: 'm.fecha',
    filtros: {
      sucursalId: 'm.sucursal_id = $',
      tipoMovimiento: 'm.tipo_movimiento = $',
    },
    dimensiones: {
      ninguno: DIM_NINGUNO,
      sucursal: {
        grupo: 'm.sucursal_id',
        etiqueta: 's.nombre',
        joins: ['JOIN sucursales s ON s.id = m.sucursal_id'],
      },
      tipo_movimiento: { grupo: 'm.tipo_movimiento', etiqueta: 'm.tipo_movimiento', joins: [] },
      producto: { grupo: 'p.id', etiqueta: 'p.titulo', joins: [JOIN_PRODUCTO_DESDE_MOV] },
      categoria: {
        grupo: 'c.id',
        etiqueta: 'c.nombre',
        joins: [JOIN_PRODUCTO_DESDE_MOV, 'JOIN categorias c ON c.id = p.categoria_id'],
      },
      dia: {
        grupo: "date_trunc('day', m.fecha)",
        etiqueta: "to_char(date_trunc('day', m.fecha), 'YYYY-MM-DD')",
        joins: [],
      },
      mes: {
        grupo: "date_trunc('month', m.fecha)",
        etiqueta: "to_char(date_trunc('month', m.fecha), 'YYYY-MM')",
        joins: [],
      },
    },
    estadoValido: null,
    filtroEstadoPorDefecto: null,
    permiteComparacion: true,
  };
}
```

Y dentro de `CATALOGO_METRICAS`:

```ts
  movimientos_unidades: definicionKardex('COALESCE(SUM(m.cantidad), 0)'),
  movimientos_conteo: definicionKardex('COUNT(m.id)'),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/service/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ia/service/
git commit -m "feat(ia): metricas de kardex con su columna fecha propia"
```

---

### Task 9: Métricas de reservas y el campo de fecha ambiguo

**Files:**
- Modify: `mirroria-backend/src/modules/ia/service/catalogo-metricas.ts`
- Modify: `mirroria-backend/src/modules/ia/service/motor-consulta.service.ts`
- Test: `mirroria-backend/src/modules/ia/service/motor-consulta.service.spec.ts`

**Interfaces:**
- Produces: métricas `cantidad_reservas`, `unidades_reservadas`; campo nuevo `DefinicionMetrica.columnaFechaAlterna?: string`; `ESTADOS_RESERVA` exportado para Task 14.

- [ ] **Step 1: Write the failing test**

```ts
// en motor-consulta.service.spec.ts
describe('reservas y campoFecha', () => {
  it('por defecto filtra por la fecha de creacion de la reserva', async () => {
    await service.ejecutar(
      ficha({ metrica: 'cantidad_reservas', agruparPor: 'estado', filtros: { desde: '2026-08-01' } }),
    );
    expect(sqlDeLaLlamada()).toContain('r."createdAt" >= $');
  });

  it('campoFecha prevista filtra por fecha_hora_prevista', async () => {
    await service.ejecutar(
      ficha({
        metrica: 'cantidad_reservas', agruparPor: 'estado',
        campoFecha: 'prevista', filtros: { desde: '2026-08-01' },
      }),
    );
    expect(sqlDeLaLlamada()).toContain('r.fecha_hora_prevista >= $');
    expect(sqlDeLaLlamada()).not.toContain('r."createdAt" >= $');
  });

  it('campoFecha sobre una metrica que no es de reservas es invalido', async () => {
    await expect(
      service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno', campoFecha: 'prevista' })),
    ).rejects.toThrow(CombinacionInvalidaException);
  });

  it('NO_SHOW es estado valido de reserva pero no de venta', async () => {
    await service.ejecutar(
      ficha({ metrica: 'cantidad_reservas', agruparPor: 'ninguno', filtros: { estado: 'NO_SHOW' } }),
    );
    expect(paramsDeLaLlamada()).toContain('NO_SHOW');

    query.mockClear();
    await expect(
      service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { estado: 'NO_SHOW' } })),
    ).rejects.toThrow(CombinacionInvalidaException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/motor-consulta.service.spec.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

En `catalogo-metricas.ts`, agregar el campo opcional a la interfaz `DefinicionMetrica`:

```ts
  /** Segunda columna de fecha, elegible con `ficha.campoFecha`. Solo reservas. Ver spec 4-bis.2. */
  columnaFechaAlterna?: string;
```

Y las dos métricas:

```ts
export const ESTADOS_RESERVA = [
  'PENDIENTE', 'CONFIRMADA', 'EN_TIENDA', 'COMPLETADA', 'CANCELADA', 'EXPIRADA', 'NO_SHOW',
] as const;

const JOIN_RESERVA_ITEMS = 'JOIN reserva_items ri ON ri.reserva_id = r.id';

function definicionReservas(seleccion: string, joinsBase: string[]): DefinicionMetrica {
  return {
    dominio: 'reservas',
    from: 'reservas r',
    joinsBase,
    seleccion,
    // created_at = cuando se hizo la reserva. fecha_hora_prevista = cuando la
    // clienta va a la tienda. Son preguntas distintas. Ver spec 4-bis.2.
    columnaFecha: 'r."createdAt"',
    columnaFechaAlterna: 'r.fecha_hora_prevista',
    filtros: { sucursalId: 'r.sucursal_id = $', estado: 'r.estado = $', clienteId: 'r.cliente_id = $' },
    dimensiones: {
      ninguno: DIM_NINGUNO,
      estado: { grupo: 'r.estado', etiqueta: 'r.estado', joins: [] },
      sucursal: {
        grupo: 'r.sucursal_id',
        etiqueta: 's.nombre',
        joins: ['JOIN sucursales s ON s.id = r.sucursal_id'],
      },
      dia: {
        grupo: "date_trunc('day', r."createdAt")",
        etiqueta: "to_char(date_trunc('day', r."createdAt"), 'YYYY-MM-DD')",
        joins: [],
      },
      mes: {
        grupo: "date_trunc('month', r."createdAt")",
        etiqueta: "to_char(date_trunc('month', r."createdAt"), 'YYYY-MM')",
        joins: [],
      },
    },
    estadoValido: ESTADOS_RESERVA,
    // Una reserva PENDIENTE es una reserva real: no hay estado "correcto" por
    // defecto como si lo hay en ventas.
    filtroEstadoPorDefecto: null,
    permiteComparacion: true,
  };
}
```

```ts
  cantidad_reservas: definicionReservas('COUNT(DISTINCT r.id)', []),
  unidades_reservadas: definicionReservas('COALESCE(SUM(ri.cantidad), 0)', [JOIN_RESERVA_ITEMS]),
```

En `motor-consulta.service.ts`, reemplazar entero el bloque de fechas (paso 3) por:

```ts
    // 3. Rango de fechas. `rango` (comparacion) pisa al de los filtros.
    const desde = rango?.desde ?? filtros.desde;
    const hasta = rango?.hasta ?? filtros.hasta;

    if (ficha.campoFecha && !def.columnaFechaAlterna) {
      throw new CombinacionInvalidaException(
        `la metrica "${ficha.metrica}" no tiene un campo de fecha alternativo`,
      );
    }
    const columnaFecha =
      ficha.campoFecha === 'prevista' ? def.columnaFechaAlterna : def.columnaFecha;

    if ((desde || hasta) && !columnaFecha) {
      throw new CombinacionInvalidaException(
        `la metrica "${ficha.metrica}" no tiene dimension temporal: no admite filtro de fechas`,
      );
    }
    if (desde && columnaFecha) {
      params.push(desde);
      condiciones.push(`${columnaFecha} >= $${params.length}`);
    }
    if (hasta && columnaFecha) {
      params.push(hasta);
      condiciones.push(`${columnaFecha} <= $${params.length}`);
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ia/
git commit -m "feat(ia): metricas de reservas con eleccion de campo de fecha"
```

---

### Task 10: Métricas de cupones — desde `ventas`, no desde el contador

La trampa más peligrosa del esquema: `cupones.usos_actuales` no tiene fecha.

**Files:**
- Modify: `mirroria-backend/src/modules/ia/service/catalogo-metricas.ts`
- Test: `mirroria-backend/src/modules/ia/service/motor-consulta.service.spec.ts`

**Interfaces:**
- Produces: métricas `canjes_cupon`, `descuento_por_cupon`; dimensión `cupon`.

- [ ] **Step 1: Write the failing test**

```ts
// en motor-consulta.service.spec.ts
describe('metricas de cupones', () => {
  it('cuenta canjes desde ventas, nunca desde cupones.usos_actuales', async () => {
    await service.ejecutar(ficha({ metrica: 'canjes_cupon', agruparPor: 'cupon' }));
    const sql = sqlDeLaLlamada();
    expect(sql).toContain('FROM ventas v');
    // usos_actuales es un acumulado sin fecha: usarlo daria el mismo numero
    // para cualquier rango que se pida. Ver spec 4-bis.1.
    expect(sql).not.toContain('usos_actuales');
  });

  it('solo mira ventas que efectivamente usaron cupon', async () => {
    await service.ejecutar(ficha({ metrica: 'canjes_cupon', agruparPor: 'cupon' }));
    expect(sqlDeLaLlamada()).toContain('JOIN cupones cu ON cu.id = v.cupon_id');
  });

  it('acepta filtro de fechas, que es el punto de contarlo desde ventas', async () => {
    await service.ejecutar(
      ficha({ metrica: 'canjes_cupon', agruparPor: 'cupon', filtros: { desde: '2026-08-01' } }),
    );
    expect(sqlDeLaLlamada()).toContain('v."createdAt" >= $');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/motor-consulta.service.spec.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
/**
 * Los canjes salen de `ventas`, agrupando por cupon_id. NO de
 * `cupones.usos_actuales`: ese contador es un acumulado sin fecha, y usarlo
 * devolveria el mismo numero para cualquier periodo. Ver spec 4-bis.1.
 *
 * El JOIN a cupones es INNER: ya descarta por si solo las ventas sin cupon,
 * pase lo que pase con el filtro de estado.
 */
function definicionCupones(seleccion: string): DefinicionMetrica {
  return {
    dominio: 'cupones',
    from: 'ventas v',
    joinsBase: ['JOIN cupones cu ON cu.id = v.cupon_id'],
    seleccion,
    columnaFecha: 'v."createdAt"',
    filtros: { sucursalId: 'v.sucursal_id = $', canal: 'v.canal = $', estado: 'v.estado = $' },
    dimensiones: {
      ninguno: DIM_NINGUNO,
      cupon: { grupo: 'cu.id', etiqueta: 'cu.codigo', joins: [] },
      sucursal: {
        grupo: 'v.sucursal_id',
        etiqueta: 's.nombre',
        joins: ['JOIN sucursales s ON s.id = v.sucursal_id'],
      },
      mes: {
        grupo: "date_trunc('month', v."createdAt")",
        etiqueta: "to_char(date_trunc('month', v."createdAt"), 'YYYY-MM')",
        joins: [],
      },
    },
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA'",
    permiteComparacion: true,
  };
}
```

```ts
  canjes_cupon: definicionCupones('COUNT(DISTINCT v.id)'),
  descuento_por_cupon: definicionCupones('COALESCE(SUM(v.descuento_cents), 0)'),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/service/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ia/service/
git commit -m "feat(ia): canjes de cupon contados desde ventas, con fecha real"
```

---

### Task 11: Métricas de compras sobre `jsonb`

`ordenes_compra.items` es un array jsonb, no una tabla. Es la única métrica que no es un
`SUM` sobre una columna.

**Files:**
- Modify: `mirroria-backend/src/modules/ia/service/catalogo-metricas.ts`
- Test: `mirroria-backend/src/modules/ia/service/motor-consulta.service.spec.ts`

**Interfaces:**
- Produces: métricas `cantidad_ordenes`, `unidades_pedidas`, `unidades_recibidas`; dimensión `proveedor`; `ESTADOS_ORDEN` exportado para Task 14.

- [ ] **Step 1: Write the failing test**

```ts
// en motor-consulta.service.spec.ts
describe('metricas de compras', () => {
  it('unidades_pedidas expande el jsonb de items', async () => {
    await service.ejecutar(ficha({ metrica: 'unidades_pedidas', agruparPor: 'proveedor' }));
    const sql = sqlDeLaLlamada();
    expect(sql).toContain('jsonb_array_elements');
    expect(sql).toContain('cantidadPedida');
  });

  it('cantidad_ordenes NO expande el jsonb: contaria una orden por cada item', async () => {
    await service.ejecutar(ficha({ metrica: 'cantidad_ordenes', agruparPor: 'proveedor' }));
    expect(sqlDeLaLlamada()).not.toContain('jsonb_array_elements');
  });

  it('filtra por fecha_pedido', async () => {
    await service.ejecutar(
      ficha({ metrica: 'cantidad_ordenes', agruparPor: 'ninguno', filtros: { desde: '2026-08-01' } }),
    );
    expect(sqlDeLaLlamada()).toContain('oc.fecha_pedido >= $');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/motor-consulta.service.spec.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
export const ESTADOS_ORDEN = [
  'PENDIENTE', 'EN_TRANSITO', 'RECIBIDA_PARCIAL', 'RECIBIDA', 'CANCELADA',
] as const;

/** `ordenes_compra.items` es jsonb, no una tabla. Ver spec 4-bis.4. */
const JOIN_ITEMS_JSONB = 'CROSS JOIN LATERAL jsonb_array_elements(oc.items) AS it(item)';

const DIMENSIONES_COMPRAS: Partial<Record<Dimension, DimensionSpec>> = {
  ninguno: DIM_NINGUNO,
  estado: { grupo: 'oc.estado', etiqueta: 'oc.estado', joins: [] },
  proveedor: {
    grupo: 'oc.proveedor_id',
    etiqueta: 'pr.nombre',
    joins: ['JOIN proveedores pr ON pr.id = oc.proveedor_id'],
  },
  sucursal: {
    grupo: 'oc.sucursal_destino_id',
    etiqueta: 's.nombre',
    joins: ['JOIN sucursales s ON s.id = oc.sucursal_destino_id'],
  },
  mes: {
    grupo: "date_trunc('month', oc.fecha_pedido)",
    etiqueta: "to_char(date_trunc('month', oc.fecha_pedido), 'YYYY-MM')",
    joins: [],
  },
};

function definicionCompras(seleccion: string, joinsBase: string[]): DefinicionMetrica {
  return {
    dominio: 'compras',
    from: 'ordenes_compra oc',
    joinsBase,
    seleccion,
    columnaFecha: 'oc.fecha_pedido',
    filtros: {
      proveedorId: 'oc.proveedor_id = $',
      sucursalId: 'oc.sucursal_destino_id = $',
      estado: 'oc.estado = $',
    },
    dimensiones: DIMENSIONES_COMPRAS,
    estadoValido: ESTADOS_ORDEN,
    filtroEstadoPorDefecto: null,
    permiteComparacion: true,
  };
}
```

```ts
  cantidad_ordenes: definicionCompras('COUNT(DISTINCT oc.id)', []),
  unidades_pedidas: definicionCompras(
    "COALESCE(SUM((it.item->>'cantidadPedida')::int), 0)", [JOIN_ITEMS_JSONB],
  ),
  unidades_recibidas: definicionCompras(
    "COALESCE(SUM((it.item->>'cantidadRecibida')::int), 0)", [JOIN_ITEMS_JSONB],
  ),
```

> **Verificar antes de dar la tarea por cerrada:** confirmar con
> `docker exec -it $(docker ps -qf name=postgres-db) psql -U mirroria -d mirroria_db -c "SELECT items FROM ordenes_compra LIMIT 1"`
> que las claves del jsonb están en camelCase (`cantidadPedida`). TypeORM serializa la
> interfaz `OrdenCompraItem` tal cual, así que deberían estarlo — pero si salen en
> snake_case, corregir las dos expresiones.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/service/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ia/service/
git commit -m "feat(ia): metricas de compras agregando sobre el jsonb de items"
```

---

### Task 12: Métrica de clientes, excluyendo las ventas sin cliente

**Files:**
- Modify: `mirroria-backend/src/modules/ia/service/catalogo-metricas.ts`
- Test: `mirroria-backend/src/modules/ia/service/motor-consulta.service.spec.ts`

**Interfaces:**
- Produces: métrica `clientes_activos`; dimensión `cliente` en todas las métricas de ventas.

- [ ] **Step 1: Write the failing test**

```ts
// en motor-consulta.service.spec.ts
describe('metricas de clientes', () => {
  it('cuenta clientes distintos, no ventas', async () => {
    await service.ejecutar(ficha({ metrica: 'clientes_activos', agruparPor: 'ninguno' }));
    expect(sqlDeLaLlamada()).toContain('COUNT(DISTINCT v.cliente_id)');
  });

  it('excluye las ventas sin cliente identificado', async () => {
    await service.ejecutar(ficha({ metrica: 'clientes_activos', agruparPor: 'sucursal' }));
    // Una venta presencial puede no identificar al cliente. Sin esto,
    // "mis mejores clientes" mostraria un grupo vacio enorme. Ver spec 4-bis.5.
    expect(sqlDeLaLlamada()).toContain('v.cliente_id IS NOT NULL');
  });

  it('agrupar ingresos por cliente etiqueta con el nombre del usuario', async () => {
    await service.ejecutar(ficha({ metrica: 'ingresos', agruparPor: 'cliente' }));
    expect(sqlDeLaLlamada()).toContain('JOIN usuarios u ON u.id = v.cliente_id');
    expect(sqlDeLaLlamada()).toContain('u.full_name');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/motor-consulta.service.spec.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Agregar la dimensión `cliente` dentro del objeto que devuelve `dimensionesDeVentas()`:

```ts
    // Un "cliente" es un `usuarios` con rol CUSTOMER: no hay entidad propia.
    // El INNER JOIN ya descarta las ventas sin cliente. Ver spec 4-bis.5.
    cliente: {
      grupo: 'v.cliente_id',
      etiqueta: 'u.full_name',
      joins: ['JOIN usuarios u ON u.id = v.cliente_id'],
    },
```

Y la métrica nueva:

```ts
  clientes_activos: {
    dominio: 'clientes',
    from: 'ventas v',
    joinsBase: [],
    seleccion: 'COUNT(DISTINCT v.cliente_id)',
    columnaFecha: 'v."createdAt"',
    filtros: FILTROS_VENTAS,
    dimensiones: dimensionesDeVentas(),
    estadoValido: ESTADOS_VENTA,
    filtroEstadoPorDefecto: "v.estado = 'PAGADA' AND v.cliente_id IS NOT NULL",
    permiteComparacion: true,
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/service/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ia/service/
git commit -m "feat(ia): metrica de clientes activos sin contar ventas anonimas"
```

---

### Task 13: Comparación entre dos períodos

**Files:**
- Modify: `mirroria-backend/src/modules/ia/dto/reporte-response.dto.ts`
- Modify: `mirroria-backend/src/modules/ia/service/ia.service.ts`
- Test: `mirroria-backend/src/modules/ia/service/ia.service.spec.ts`

**Interfaces:**
- Produces: `VariacionDto = { clave, etiqueta, actual, anterior, deltaAbsoluto, deltaPorcentual: number | null }`,
  `ComparacionDto = { rango, filas, variaciones }`.

- [ ] **Step 1: Write the failing test**

Agregar al principio de `ia.service.spec.ts`:

```ts
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
```

Y el bloque:

```ts
describe('comparacion de periodos', () => {
  const ADMIN = { sub: 'u1', role: 'ADMIN', sucursalId: null };

  it('corre la misma consulta dos veces, una por rango', async () => {
    motor.ejecutar
      .mockResolvedValueOnce([{ clave: 'a', etiqueta: 'Santa Cruz', valor: 150 }])
      .mockResolvedValueOnce([{ clave: 'a', etiqueta: 'Santa Cruz', valor: 100 }]);

    const res = await service.consultar(
      ficha({
        metrica: 'ingresos', agruparPor: 'sucursal',
        filtros: { desde: '2026-08-01', hasta: '2026-08-31' },
        compararCon: { desde: '2026-07-01', hasta: '2026-07-31' },
      }),
      ADMIN,
    );

    expect(motor.ejecutar).toHaveBeenCalledTimes(2);
    expect(res.comparacion?.variaciones[0]).toMatchObject({
      actual: 150, anterior: 100, deltaAbsoluto: 50, deltaPorcentual: 50,
    });
  });

  it('una clave que no existia antes tiene anterior 0 y delta porcentual nulo', async () => {
    motor.ejecutar
      .mockResolvedValueOnce([{ clave: 'b', etiqueta: 'La Paz', valor: 80 }])
      .mockResolvedValueOnce([]);

    const res = await service.consultar(
      ficha({
        metrica: 'ingresos', agruparPor: 'sucursal',
        compararCon: { desde: '2026-07-01', hasta: '2026-07-31' },
      }),
      ADMIN,
    );

    // No dividir por cero: sin base anterior el porcentaje no existe.
    expect(res.comparacion?.variaciones[0]).toMatchObject({
      actual: 80, anterior: 0, deltaAbsoluto: 80, deltaPorcentual: null,
    });
  });

  it('rechaza comparar una metrica de inventario', async () => {
    await expect(
      service.consultar(
        ficha({
          metrica: 'stock_disponible', agruparPor: 'sucursal',
          compararCon: { desde: '2026-07-01', hasta: '2026-07-31' },
        }),
        ADMIN,
      ),
    ).rejects.toThrow(CombinacionInvalidaException);
  });

  it('sin compararCon no hay segunda consulta', async () => {
    await service.consultar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno' }), ADMIN);
    expect(motor.ejecutar).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/ia.service.spec.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

En `reporte-response.dto.ts`, agregar:

```ts
export interface VariacionDto {
  clave: string;
  etiqueta: string;
  actual: number;
  anterior: number;
  deltaAbsoluto: number;
  /** null cuando el periodo anterior es 0: el porcentaje no existe, no es infinito. */
  deltaPorcentual: number | null;
}

export interface ComparacionDto {
  rango: { desde: string; hasta: string };
  filas: FilaReporte[];
  variaciones: VariacionDto[];
}
```

y cambiar la propiedad `comparacion!: unknown | null;` por `comparacion!: ComparacionDto | null;`.

En `ia.service.ts`, reemplazar el método `consultar` completo por:

```ts
  async consultar(ficha: FichaConsultaDto, user: JwtPayload): Promise<ReporteResponseDto> {
    const fichaEfectiva = this.forzarAlcance(ficha, user);
    const filas = await this.motor.ejecutar(fichaEfectiva);

    if (!fichaEfectiva.compararCon) {
      return { ficha: fichaEfectiva, filas, comparacion: null, narrativa: null };
    }

    if (!CATALOGO_METRICAS[fichaEfectiva.metrica].permiteComparacion) {
      throw new CombinacionInvalidaException(
        `la metrica "${fichaEfectiva.metrica}" no admite comparacion entre periodos`,
      );
    }

    // La MISMA consulta con otro rango. Asi es imposible que los dos periodos
    // se calculen distinto. Ver spec 4.5.
    const anteriores = await this.motor.ejecutar(fichaEfectiva, fichaEfectiva.compararCon);
    const porClave = new Map(anteriores.map((f) => [f.clave, f.valor]));

    const variaciones = filas.map((fila) => {
      const anterior = porClave.get(fila.clave) ?? 0;
      return {
        clave: fila.clave,
        etiqueta: fila.etiqueta,
        actual: fila.valor,
        anterior,
        deltaAbsoluto: fila.valor - anterior,
        deltaPorcentual:
          anterior === 0 ? null : Math.round(((fila.valor - anterior) / anterior) * 100),
      };
    });

    return {
      ficha: fichaEfectiva,
      filas,
      comparacion: { rango: fichaEfectiva.compararCon, filas: anteriores, variaciones },
      narrativa: null,
    };
  }
```

Agregar los imports que faltan en `ia.service.ts`:

```ts
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
import { CATALOGO_METRICAS } from './catalogo-metricas.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/`
Expected: PASS

- [ ] **Step 5: Cierre de la etapa 2**

Run: `npm test && npm run lint`
Expected: verde, con las 18 métricas declaradas y probadas.

- [ ] **Step 6: Commit**

```bash
git add src/modules/ia/
git commit -m "feat(ia): comparacion entre dos periodos con variacion por fila"
```

---

## Etapa 3 — La capa de LLM

---

### Task 14: Contrato del proveedor y prompt generado desde el catálogo

El prompt **se deriva del catálogo**, no se escribe a mano. Así nunca puede quedar
desfasado de lo que el motor sabe hacer: agregar una métrica lo actualiza solo.

**Files:**
- Create: `mirroria-backend/src/modules/ia/service/proveedor-ia/proveedor-ia.interface.ts`
- Create: `mirroria-backend/src/modules/ia/service/proveedor-ia/esquema-ficha.ts`
- Create: `mirroria-backend/src/modules/ia/exception/consulta-no-comprendida.exception.ts`
- Create: `mirroria-backend/src/modules/ia/exception/ia-no-configurada.exception.ts`
- Test: `mirroria-backend/src/modules/ia/service/proveedor-ia/esquema-ficha.spec.ts`

**Interfaces:**
- Consumes: `CATALOGO_METRICAS`, `METRICAS` de Task 2
- Produces: `ProveedorIa` (interface con `extraerFicha(texto): Promise<unknown>` y `narrar(ficha, filas): Promise<string>`), `PROVEEDOR_IA` (token de inyección), `construirInstruccion(): string`, `ESQUEMA_FICHA` (JSON Schema), `ConsultaNoComprendidaException`, `IaNoConfiguradaException`.

- [ ] **Step 1: Write the failing test**

```ts
// esquema-ficha.spec.ts
import { describe, expect, it } from 'vitest';
import { construirInstruccion, ESQUEMA_FICHA } from './esquema-ficha.js';
import { CATALOGO_METRICAS, METRICAS } from '../catalogo-metricas.js';

describe('esquema y prompt derivados del catalogo', () => {
  it('el esquema enumera exactamente las metricas del catalogo', () => {
    expect(ESQUEMA_FICHA.properties.metrica.enum).toEqual([...METRICAS]);
  });

  it('la instruccion nombra cada metrica con sus dimensiones admitidas', () => {
    const texto = construirInstruccion();
    for (const m of METRICAS) {
      expect(texto).toContain(m);
    }
    // stock_disponible no admite dia: la instruccion no debe ofrecerlo
    const lineaStock = texto.split('\n').find((l) => l.startsWith('- stock_disponible'));
    expect(lineaStock).toBeDefined();
    expect(lineaStock).not.toContain('dia');
  });

  it('agregar una metrica al catalogo la agrega al prompt sin tocar el prompt', () => {
    // Garantia estructural: la instruccion se deriva, no se escribe a mano.
    const cantidadEnPrompt = construirInstruccion()
      .split('\n')
      .filter((l) => l.startsWith('- ')).length;
    expect(cantidadEnPrompt).toBe(Object.keys(CATALOGO_METRICAS).length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/proveedor-ia/`
Expected: FAIL — módulo inexistente

- [ ] **Step 3: Write minimal implementation**

```ts
// consulta-no-comprendida.exception.ts
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class ConsultaNoComprendidaException extends BusinessException {
  constructor(textoOriginal: string) {
    super(
      `No se pudo interpretar la consulta: "${textoOriginal}". Probá preguntarlo de otra forma.`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
```

```ts
// ia-no-configurada.exception.ts
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class IaNoConfiguradaException extends BusinessException {
  constructor() {
    super(
      'El asistente de reportes no esta configurado (falta IA_API_KEY). ' +
        'Se puede usar POST /ia/reportes/consulta con una ficha armada a mano.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
```

```ts
// proveedor-ia.interface.ts
import type { FichaConsultaDto } from '../../dto/ficha-consulta.dto.js';
import type { FilaReporte } from '../motor-consulta.service.js';

/** Token de inyeccion: NestJS no puede inyectar por interface de TypeScript. */
export const PROVEEDOR_IA = Symbol('PROVEEDOR_IA');

export interface ProveedorIa {
  /** Devuelve el objeto crudo del modelo. Validarlo es responsabilidad del llamador. */
  extraerFicha(texto: string): Promise<unknown>;
  narrar(ficha: FichaConsultaDto, filas: FilaReporte[]): Promise<string>;
  estaConfigurado(): boolean;
}
```

```ts
// esquema-ficha.ts
import { CATALOGO_METRICAS, METRICAS, type Metrica } from '../catalogo-metricas.js';

/**
 * JSON Schema que se le pasa a Gemini como `responseSchema`. El modelo devuelve
 * algo que cumple esta forma o falla — no hay parseo de texto libre.
 * Se deriva del catalogo: nunca puede ofrecer una metrica que el motor no tenga.
 */
export const ESQUEMA_FICHA = {
  type: 'object',
  properties: {
    metrica: { type: 'string', enum: [...METRICAS] },
    agruparPor: {
      type: 'string',
      enum: [
        'sucursal', 'categoria', 'producto', 'canal', 'estado',
        'cliente', 'cupon', 'proveedor', 'tipo_movimiento', 'dia', 'mes', 'ninguno',
      ],
    },
    filtros: {
      type: 'object',
      properties: {
        desde: { type: 'string' },
        hasta: { type: 'string' },
        canal: { type: 'string' },
        estado: { type: 'string' },
        tipoMovimiento: { type: 'string' },
      },
    },
    campoFecha: { type: 'string', enum: ['creacion', 'prevista'] },
    compararCon: {
      type: 'object',
      properties: { desde: { type: 'string' }, hasta: { type: 'string' } },
    },
    orden: { type: 'string', enum: ['asc', 'desc'] },
    limite: { type: 'integer' },
  },
  required: ['metrica', 'agruparPor'],
} as const;

/**
 * La instruccion del sistema, derivada del catalogo. Cada metrica se describe con
 * las dimensiones que realmente admite, asi el modelo no propone combinaciones
 * que el motor va a rechazar.
 *
 * Los filtros por id (sucursalId, categoriaId...) NO se le ofrecen al modelo:
 * no conoce los uuid de la base. El alcance por sucursal lo impone el backend
 * desde el JWT (ver IaService.forzarAlcance).
 */
export function construirInstruccion(): string {
  const lineas = (Object.keys(CATALOGO_METRICAS) as Metrica[]).map((m) => {
    const def = CATALOGO_METRICAS[m];
    const dims = Object.keys(def.dimensiones).join(', ');
    const tiempo = def.columnaFecha ? 'admite fechas' : 'SIN fechas (foto del presente)';
    const comparacion = def.permiteComparacion ? 'comparable' : 'NO comparable';
    return `- ${m} (${def.dominio}): agrupar por [${dims}]. ${tiempo}, ${comparacion}.`;
  });

  return [
    'Sos un traductor de preguntas de negocio a una ficha de consulta estructurada.',
    'Devolves SOLO la ficha. No escribis SQL, no inventas datos, no respondes la pregunta.',
    '',
    'Metricas disponibles:',
    ...lineas,
    '',
    'Reglas:',
    '- Las fechas van en formato YYYY-MM-DD.',
    '- Si la pregunta no menciona periodo, no pongas filtros de fecha.',
    '- Si la pregunta compara dos periodos ("vs el mes pasado"), usa compararCon.',
    '- Si piden un "top N" o "los mas/menos", usa limite y orden.',
    '- Si la pregunta no se puede responder con ninguna metrica de la lista, devolve metrica vacia.',
    '- campoFecha solo aplica a metricas de reservas.',
  ].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/service/proveedor-ia/`
Expected: PASS (3 casos)

- [ ] **Step 5: Commit**

```bash
git add src/modules/ia/service/proveedor-ia/ src/modules/ia/exception/
git commit -m "feat(ia): contrato del proveedor y prompt derivado del catalogo"
```

---

### Task 15: Adaptador Gemini y endpoint `POST /ia/reportes`

**Files:**
- Create: `mirroria-backend/src/modules/ia/service/proveedor-ia/gemini.proveedor.ts`
- Create: `mirroria-backend/src/modules/ia/dto/prompt.dto.ts`
- Modify: `mirroria-backend/src/modules/ia/service/ia.service.ts`
- Modify: `mirroria-backend/src/modules/ia/controller/ia.controller.ts`
- Modify: `mirroria-backend/src/modules/ia/ia.module.ts`
- Modify: `mirroria-backend/.env.example`
- Test: `mirroria-backend/src/modules/ia/service/ia.service.spec.ts` (nuevo `describe`)

**Interfaces:**
- Consumes: `ProveedorIa`, `PROVEEDOR_IA`, `ESQUEMA_FICHA`, `construirInstruccion`, `InteraccionIa`
- Produces: `GeminiProveedor`, `PromptDto = { prompt: string }`, `IaService.preguntar(dto, user): Promise<ReporteResponseDto>`

- [ ] **Step 1: Write the failing test**

```ts
// en ia.service.spec.ts
describe('preguntar (con LLM)', () => {
  const ADMIN = { sub: 'u1', role: 'ADMIN', sucursalId: null };
  let proveedor: { extraerFicha: ReturnType<typeof vi.fn>; narrar: ReturnType<typeof vi.fn>; estaConfigurado: ReturnType<typeof vi.fn> };
  let repo: { create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    proveedor = {
      extraerFicha: vi.fn().mockResolvedValue({ metrica: 'ingresos', agruparPor: 'sucursal' }),
      narrar: vi.fn().mockResolvedValue('Santa Cruz lidera con Bs 1.500.'),
      estaConfigurado: vi.fn().mockReturnValue(true),
    };
    repo = { create: vi.fn((e) => e), save: vi.fn((e) => Promise.resolve(e)) };
    service = new IaService(
      motor as unknown as MotorConsultaService,
      proveedor as unknown as ProveedorIa,
      repo as unknown as Repository<InteraccionIa>,
    );
  });

  it('traduce la pregunta, consulta y narra', async () => {
    const res = await service.preguntar({ prompt: 'cuanto vendi por sucursal' }, ADMIN);
    expect(proveedor.extraerFicha).toHaveBeenCalledWith('cuanto vendi por sucursal');
    expect(res.ficha.metrica).toBe('ingresos');
    expect(res.narrativa).toBe('Santa Cruz lidera con Bs 1.500.');
  });

  it('registra la interaccion con el usuario del JWT', async () => {
    await service.preguntar({ prompt: 'cuanto vendi' }, ADMIN);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 'u1', inputText: 'cuanto vendi' }),
    );
  });

  it('una ficha invalida del modelo es 422, no una consulta', async () => {
    proveedor.extraerFicha.mockResolvedValue({ metrica: 'inventada', agruparPor: 'sucursal' });
    await expect(service.preguntar({ prompt: 'algo raro' }, ADMIN)).rejects.toThrow(
      ConsultaNoComprendidaException,
    );
    expect(motor.ejecutar).not.toHaveBeenCalled();
  });

  it('registra tambien la consulta que no se entendio, con output nulo', async () => {
    proveedor.extraerFicha.mockResolvedValue({ metrica: 'inventada', agruparPor: 'sucursal' });
    await expect(service.preguntar({ prompt: 'algo raro' }, ADMIN)).rejects.toThrow();
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ inputText: 'algo raro', outputText: null }),
    );
  });

  it('sin clave configurada devuelve 503', async () => {
    proveedor.estaConfigurado.mockReturnValue(false);
    await expect(service.preguntar({ prompt: 'cuanto vendi' }, ADMIN)).rejects.toThrow(
      IaNoConfiguradaException,
    );
  });
});
```

Imports que faltan en el spec:

```ts
import type { Repository } from 'typeorm';
import type { ProveedorIa } from './proveedor-ia/proveedor-ia.interface.js';
import type { InteraccionIa } from '../entities/interaccion-ia.entity.js';
import { ConsultaNoComprendidaException } from '../exception/consulta-no-comprendida.exception.js';
import { IaNoConfiguradaException } from '../exception/ia-no-configurada.exception.js';
```

> **Ojo:** los tests de Tasks 5 y 13 construyen `new IaService(motor)` con un solo argumento.
> Al agregar dependencias hay que actualizarlos para que pasen los tres. Hacerlo en este
> mismo paso: es parte de la tarea, no un arreglo aparte.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/ia.service.spec.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
// prompt.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class PromptDto {
  @ApiProperty({ example: 'cuanto vendi en agosto por sucursal' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  prompt!: string;
}
```

```ts
// gemini.proveedor.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FichaConsultaDto } from '../../dto/ficha-consulta.dto.js';
import type { FilaReporte } from '../motor-consulta.service.js';
import { construirInstruccion, ESQUEMA_FICHA } from './esquema-ficha.js';
import type { ProveedorIa } from './proveedor-ia.interface.js';

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Habla con Gemini por HTTP directo: Node 24 trae `fetch` global, asi que no
 * hace falta agregar un SDK al proyecto (una dependencia menos que mantener).
 * `responseSchema` obliga al modelo a devolver JSON con la forma de la ficha.
 */
@Injectable()
export class GeminiProveedor implements ProveedorIa {
  private readonly logger = new Logger(GeminiProveedor.name);
  private readonly apiKey: string | undefined;
  private readonly modelo: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('IA_API_KEY');
    this.modelo = config.get<string>('IA_MODELO') ?? 'gemini-2.0-flash';
  }

  estaConfigurado(): boolean {
    return Boolean(this.apiKey);
  }

  async extraerFicha(texto: string): Promise<unknown> {
    const json = await this.generar({
      systemInstruction: { parts: [{ text: construirInstruccion() }] },
      contents: [{ role: 'user', parts: [{ text: texto }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: ESQUEMA_FICHA,
        temperature: 0,
      },
    });
    try {
      return JSON.parse(json) as unknown;
    } catch {
      return null;
    }
  }

  async narrar(ficha: FichaConsultaDto, filas: FilaReporte[]): Promise<string> {
    const datos = filas.map((f) => `${f.etiqueta}: ${f.valor}`).join('; ');
    return this.generar({
      systemInstruction: {
        parts: [
          {
            text:
              'Redacta en espanol un resumen ejecutivo de 2 o 3 frases sobre estos datos. ' +
              'Usa SOLO los numeros que te doy: no estimes, no inventes, no agregues contexto. ' +
              'Los montos vienen en centavos de boliviano.',
          },
        ],
      },
      contents: [
        { role: 'user', parts: [{ text: `Metrica: ${ficha.metrica}. Datos: ${datos || 'sin resultados'}` }] },
      ],
      generationConfig: { temperature: 0.2 },
    });
  }

  private async generar(cuerpo: unknown): Promise<string> {
    const res = await fetch(`${URL_BASE}/${this.modelo}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey ?? '' },
      body: JSON.stringify(cuerpo),
    });

    if (!res.ok) {
      this.logger.error(`Gemini respondio ${res.status}: ${await res.text()}`);
      return '';
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}
```

> **Verificar contra la documentación vigente de Google** el nombre del modelo
> (`IA_MODELO`, por defecto `gemini-2.0-flash`) y que el header de autenticación siga siendo
> `x-goog-api-key`. Si cambió, ajustar acá: está todo en un solo archivo a propósito.

En `ia.service.ts`, el bloque de imports queda así (los seis de abajo son nuevos):

```ts
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { PromptDto } from '../dto/prompt.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import { InteraccionIa, TipoInteraccion } from '../entities/interaccion-ia.entity.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
import { ConsultaNoComprendidaException } from '../exception/consulta-no-comprendida.exception.js';
import { IaNoConfiguradaException } from '../exception/ia-no-configurada.exception.js';
import { CATALOGO_METRICAS } from './catalogo-metricas.js';
import { MotorConsultaService } from './motor-consulta.service.js';
import { PROVEEDOR_IA, type ProveedorIa } from './proveedor-ia/proveedor-ia.interface.js';
```

Y el constructor y el método nuevo:

```ts
  constructor(
    private readonly motor: MotorConsultaService,
    @Inject(PROVEEDOR_IA) private readonly proveedor: ProveedorIa,
    @InjectRepository(InteraccionIa) private readonly interacciones: Repository<InteraccionIa>,
  ) {}

  /**
   * Camino completo de CU24. El modelo entra dos veces (traducir y narrar) y
   * NUNCA toca la base: entre medio corre el motor con SQL parametrizado.
   */
  async preguntar(dto: PromptDto, user: JwtPayload): Promise<ReporteResponseDto> {
    if (!this.proveedor.estaConfigurado()) {
      throw new IaNoConfiguradaException();
    }

    const crudo = await this.proveedor.extraerFicha(dto.prompt);
    const ficha = plainToInstance(FichaConsultaDto, crudo ?? {});
    const errores = validateSync(ficha, { whitelist: true, forbidNonWhitelisted: true });

    if (errores.length > 0) {
      // Una consulta no entendida tambien es dato de producto: se registra.
      await this.registrar(user, dto.prompt, null);
      throw new ConsultaNoComprendidaException(dto.prompt);
    }

    const reporte = await this.consultar(ficha, user);
    const narrativa = await this.proveedor.narrar(reporte.ficha, reporte.filas);
    await this.registrar(user, dto.prompt, narrativa);

    return { ...reporte, narrativa };
  }

  private async registrar(user: JwtPayload, input: string, output: string | null): Promise<void> {
    await this.interacciones.save(
      this.interacciones.create({
        usuarioId: user.sub,
        tipo: TipoInteraccion.REPORTE_VOZ,
        inputText: input,
        outputText: output,
      }),
    );
  }
```

En `ia.controller.ts`, el endpoint:

```ts
  @Post('reportes')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Reporte dinamico a partir de una pregunta en lenguaje natural (CU24)' })
  reportes(@Body() dto: PromptDto, @CurrentUser() user: JwtPayload): Promise<ReporteResponseDto> {
    return this.iaService.preguntar(dto, user);
  }
```

En `ia.module.ts`, registrar el proveedor bajo su token:

```ts
  providers: [
    IaService,
    MotorConsultaService,
    { provide: PROVEEDOR_IA, useClass: GeminiProveedor },
  ],
```

En `.env.example`, al final:

```
# Asistente de reportes por IA (CU24). Sin esto, POST /ia/reportes responde 503
# pero POST /ia/reportes/consulta sigue funcionando con una ficha armada a mano.
# Sacar una clave propia del proyecto en https://aistudio.google.com/apikey
IA_API_KEY=
IA_MODELO=gemini-2.0-flash
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/`
Expected: PASS

- [ ] **Step 5: Probar contra Gemini de verdad**

Poner la clave en `mirroria-backend/.env`, levantar con `npm run start:dev` y:

```bash
curl -s -X POST http://localhost:3000/api/v1/ia/reportes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"prompt":"cuanto vendi este mes por sucursal"}'
```

Expected: 200 con `ficha.metrica = "ingresos"`, `ficha.agruparPor = "sucursal"`, filas reales
y una narrativa en español. Confirmar además:
`psql -c "SELECT input_text, output_text FROM interacciones_ia ORDER BY \"createdAt\" DESC LIMIT 1"`

- [ ] **Step 6: Commit**

```bash
git add src/modules/ia/ .env.example
git commit -m "feat(ia): adaptador Gemini y endpoint de pregunta en lenguaje natural"
```

---

### Task 16: Historial de interacciones

**Files:**
- Create: `mirroria-backend/src/modules/ia/dto/interaccion-response.dto.ts`
- Modify: `mirroria-backend/src/modules/ia/service/ia.service.ts`
- Modify: `mirroria-backend/src/modules/ia/controller/ia.controller.ts`
- Test: `mirroria-backend/src/modules/ia/service/ia.service.spec.ts`

**Interfaces:**
- Produces: `IaService.historial(user): Promise<InteraccionResponseDto[]>`, `InteraccionResponseDto = { id, tipo, inputText, outputText, createdAt }`

- [ ] **Step 1: Write the failing test**

```ts
// en ia.service.spec.ts
describe('historial', () => {
  it('un ADMIN ve todas las interacciones', async () => {
    repo.find = vi.fn().mockResolvedValue([]);
    await service.historial({ sub: 'u1', role: 'ADMIN', sucursalId: null });
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: 'DESC' }, take: 50 }),
    );
    expect(repo.find.mock.calls[0][0].where).toBeUndefined();
  });

  it('un ENCARGADO_SUCURSAL solo ve las suyas', async () => {
    repo.find = vi.fn().mockResolvedValue([]);
    await service.historial({ sub: 'u2', role: 'ENCARGADO_SUCURSAL', sucursalId: 's1' });
    expect(repo.find.mock.calls[0][0].where).toEqual({ usuarioId: 'u2' });
  });

  it('no devuelve la entidad cruda sino un DTO', async () => {
    repo.find = vi.fn().mockResolvedValue([
      { id: 'i1', tipo: 'REPORTE_VOZ', inputText: 'x', outputText: 'y',
        createdAt: new Date('2026-09-21'), updatedAt: new Date('2026-09-21'), usuarioId: 'u1' },
    ]);
    const res = await service.historial({ sub: 'u1', role: 'ADMIN', sucursalId: null });
    expect(res[0]).not.toHaveProperty('updatedAt');
    expect(res[0]).not.toHaveProperty('usuarioId');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/ia/service/ia.service.spec.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
// interaccion-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class InteraccionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tipo!: string;
  @ApiProperty({ nullable: true }) inputText!: string | null;
  @ApiProperty({ nullable: true }) outputText!: string | null;
  @ApiProperty() createdAt!: Date;
}
```

En `ia.service.ts`:

```ts
  /**
   * Historial de consultas. Un ADMIN ve las de todos; un ENCARGADO_SUCURSAL
   * solo las propias — mismo criterio de alcance que el de los reportes.
   */
  async historial(user: JwtPayload): Promise<InteraccionResponseDto[]> {
    const filas = await this.interacciones.find({
      where: user.role === 'ADMIN' ? undefined : { usuarioId: user.sub },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return filas.map((i) => ({
      id: i.id,
      tipo: i.tipo,
      inputText: i.inputText,
      outputText: i.outputText,
      createdAt: i.createdAt,
    }));
  }
```

En `ia.controller.ts`:

```ts
  @Get('interacciones')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({ summary: 'Historial de consultas al asistente' })
  interacciones(@CurrentUser() user: JwtPayload): Promise<InteraccionResponseDto[]> {
    return this.iaService.historial(user);
  }
```

(agregar `Get` al import de `@nestjs/common`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/ia/ && npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ia/
git commit -m "feat(ia): historial de interacciones con alcance por rol"
```

---

## Etapa 4 — La pantalla

---

### Task 17: Tipos y cliente de API del frontend

**Files:**
- Create: `mirroria-frontend/src/features/reports/types/reports.types.ts`
- Create: `mirroria-frontend/src/features/reports/api/reportsApi.ts`

**Interfaces:**
- Consumes: `apiFetch` de `@/lib/api`
- Produces: `reportsApi.preguntar`, `reportsApi.consultar`, `reportsApi.historial`; tipos `Ficha`, `FilaReporte`, `Variacion`, `Comparacion`, `Reporte`, `Interaccion`.

- [ ] **Step 1: Escribir los tipos**

```ts
// reports.types.ts
export interface FilaReporte {
  clave: string
  etiqueta: string
  valor: number
}

export interface Variacion {
  clave: string
  etiqueta: string
  actual: number
  anterior: number
  deltaAbsoluto: number
  /** null cuando el periodo anterior fue 0: el porcentaje no existe. */
  deltaPorcentual: number | null
}

export interface Comparacion {
  rango: { desde: string; hasta: string }
  filas: FilaReporte[]
  variaciones: Variacion[]
}

export interface Ficha {
  metrica: string
  agruparPor: string
  filtros: Record<string, string | undefined>
  campoFecha?: "creacion" | "prevista"
  compararCon?: { desde: string; hasta: string }
  orden: "asc" | "desc"
  limite: number
}

export interface Reporte {
  ficha: Ficha
  filas: FilaReporte[]
  comparacion: Comparacion | null
  narrativa: string | null
}

export interface Interaccion {
  id: string
  tipo: string
  inputText: string | null
  outputText: string | null
  createdAt: string
}
```

- [ ] **Step 2: Escribir el cliente**

```ts
// reportsApi.ts
import { apiFetch } from "@/lib/api"
import type { Ficha, Interaccion, Reporte } from "../types/reports.types"

export const reportsApi = {
  /** CU24: pregunta en lenguaje natural. Devuelve 503 si no hay IA_API_KEY. */
  preguntar: (prompt: string) =>
    apiFetch<Reporte>("/ia/reportes", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  /** Ficha armada a mano. Funciona sin clave de IA. */
  consultar: (ficha: Partial<Ficha>) =>
    apiFetch<Reporte>("/ia/reportes/consulta", {
      method: "POST",
      body: JSON.stringify(ficha),
    }),

  historial: () => apiFetch<Interaccion[]>("/ia/interacciones"),
}
```

- [ ] **Step 3: Verificar que compila**

Run: `cd mirroria-frontend && npx tsc --noEmit`
Expected: sin errores

- [ ] **Step 4: Commit**

```bash
git add src/features/reports/
git commit -m "feat(reportes): tipos y cliente de API"
```

---

### Task 18: Guard para staff, ruta y entrada en el menú

`AdminRoute` exige `role === "ADMIN"` exacto, y el reporte también lo puede ver un
`ENCARGADO_SUCURSAL`. Hace falta un guard propio: reutilizar `AdminRoute` dejaría fuera a
un rol que el backend sí autoriza.

**Files:**
- Create: `mirroria-frontend/src/routes/StaffRoute.tsx`
- Modify: `mirroria-frontend/src/App.tsx`
- Modify: `mirroria-frontend/src/layouts/admin-sidebar-content.tsx`

**Interfaces:**
- Produces: `StaffRoute`

- [ ] **Step 1: Escribir el guard**

```tsx
// StaffRoute.tsx
import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

/**
 * Exige sesion + un rol de staff con acceso a reportes. Distinto de AdminRoute,
 * que pide ADMIN exacto: el backend habilita CU24 tambien al ENCARGADO_SUCURSAL
 * (acotado a su propia sucursal, forzado del lado del servidor).
 */
export function StaffRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== "ADMIN" && user?.role !== "ENCARGADO_SUCURSAL") {
    return <Navigate to="/" replace />
  }
  return children
}
```

- [ ] **Step 2: Registrar la ruta en `App.tsx`**

Agregar el import junto a los demás de `features/admin/pages`:

```tsx
import { ReportesAdminPage } from "@/features/admin/pages/ReportesAdminPage"
import { StaffRoute } from "@/routes/StaffRoute"
```

Y la ruta, junto a las otras de `/admin` (usa `StaffRoute`, no el helper `AdminPage`):

```tsx
        <Route
          path="/admin/reportes"
          element={
            <StaffRoute>
              <AdminLayout>
                <ReportesAdminPage />
              </AdminLayout>
            </StaffRoute>
          }
        />
```

- [ ] **Step 3: Agregar la entrada al menú**

En `admin-sidebar-content.tsx`, agregar `Sparkle` al import de `@phosphor-icons/react` y
sumar el ítem al grupo "Ventas y Promociones":

```tsx
      { label: "Reportes IA", href: "/admin/reportes", icon: Sparkle, badge: "IA" },
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: compila. (La página todavía no existe: crear un stub mínimo
`export function ReportesAdminPage() { return <div /> }` para que compile, y reemplazarlo
entero en Task 19.)

- [ ] **Step 5: Commit**

```bash
git add src/routes/StaffRoute.tsx src/App.tsx src/layouts/admin-sidebar-content.tsx src/features/admin/pages/ReportesAdminPage.tsx
git commit -m "feat(reportes): ruta y guard de staff para la pantalla de reportes"
```

---

### Task 19: La pantalla de reportes

**Files:**
- Create: `mirroria-frontend/src/features/reports/components/tabla-reporte.tsx`
- Modify: `mirroria-frontend/src/features/admin/pages/ReportesAdminPage.tsx`

**Interfaces:**
- Consumes: `reportsApi`, tipos de Task 17
- Produces: `TablaReporte({ reporte }: { reporte: Reporte })`, `ReportesAdminPage`

- [ ] **Step 1: La tabla**

```tsx
// tabla-reporte.tsx
import type { Reporte } from "../types/reports.types"

/**
 * Cuando hay comparacion se muestran las dos columnas y la variacion; si no,
 * una sola columna de valor. Un delta porcentual nulo se dibuja como "—":
 * significa que antes no habia base, no que no cambio.
 */
export function TablaReporte({ reporte }: { reporte: Reporte }) {
  const variaciones = reporte.comparacion?.variaciones

  if (reporte.filas.length === 0) {
    return <p className="text-sm text-muted-foreground">La consulta no devolvió resultados.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4 font-medium">Concepto</th>
            <th className="py-2 pr-4 text-right font-medium">Valor</th>
            {variaciones && <th className="py-2 pr-4 text-right font-medium">Período anterior</th>}
            {variaciones && <th className="py-2 text-right font-medium">Variación</th>}
          </tr>
        </thead>
        <tbody>
          {reporte.filas.map((fila) => {
            const v = variaciones?.find((x) => x.clave === fila.clave)
            return (
              <tr key={fila.clave} className="border-b last:border-0">
                <td className="py-2 pr-4">{fila.etiqueta}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{fila.valor.toLocaleString("es-BO")}</td>
                {variaciones && (
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {v ? v.anterior.toLocaleString("es-BO") : "—"}
                  </td>
                )}
                {variaciones && (
                  <td className="py-2 text-right tabular-nums">
                    {v?.deltaPorcentual === null || v === undefined
                      ? "—"
                      : `${v.deltaPorcentual > 0 ? "+" : ""}${v.deltaPorcentual}%`}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: La página**

```tsx
// ReportesAdminPage.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import { reportsApi } from "@/features/reports/api/reportsApi"
import { TablaReporte } from "@/features/reports/components/tabla-reporte"
import type { Reporte } from "@/features/reports/types/reports.types"

const EJEMPLOS = [
  "¿Cuánto vendí este mes por sucursal?",
  "Top 5 productos más vendidos en agosto",
  "¿Cuántas reservas se cancelaron?",
  "Ingresos de agosto comparados con julio",
]

export function ReportesAdminPage() {
  const [pregunta, setPregunta] = useState("")
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function preguntar(texto: string) {
    if (texto.trim().length < 3) return
    setCargando(true)
    setError(null)
    try {
      setReporte(await reportsApi.preguntar(texto))
    } catch (e) {
      setReporte(null)
      setError(e instanceof ApiError ? e.message : "No se pudo generar el reporte")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Reportes por IA</h1>
        <p className="text-sm text-muted-foreground">
          Preguntá en tus palabras. Los números salen siempre de la base de datos.
        </p>
      </header>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void preguntar(pregunta)
        }}
      >
        <Input
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="¿Cuánto vendí este mes por sucursal?"
          aria-label="Pregunta de negocio"
        />
        <Button type="submit" disabled={cargando}>
          {cargando ? "Consultando…" : "Consultar"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {EJEMPLOS.map((ej) => (
          <button
            key={ej}
            type="button"
            className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
            onClick={() => {
              setPregunta(ej)
              void preguntar(ej)
            }}
          >
            {ej}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {reporte && (
        <section className="space-y-4">
          {reporte.narrativa && <p className="text-base leading-relaxed">{reporte.narrativa}</p>}
          <TablaReporte reporte={reporte} />
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Cómo se entendió la pregunta</summary>
            <pre className="mt-2 overflow-x-auto rounded bg-muted p-3">
              {JSON.stringify(reporte.ficha, null, 2)}
            </pre>
          </details>
        </section>
      )}
    </div>
  )
}
```

> El bloque plegable con la ficha no es decorativo: es lo que vuelve auditable al sistema.
> El usuario ve qué métrica y qué filtros se usaron para el número que está mirando.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: compila sin errores.

- [ ] **Step 4: Probar a mano**

Con el backend arriba y `npm run dev`, entrar como ADMIN a `/admin/reportes`, tocar un
ejemplo y confirmar: aparece narrativa, tabla y ficha. Sin `IA_API_KEY`, confirmar que se ve
el mensaje de 503 y no una pantalla en blanco.

- [ ] **Step 5: Commit**

```bash
git add src/features/reports/ src/features/admin/pages/ReportesAdminPage.tsx
git commit -m "feat(reportes): pantalla con narrativa, tabla y ficha interpretada"
```

---

### Task 20: Dictado por voz

CU24 pide texto **o voz**, con la transcripción en el frontend.

**Files:**
- Create: `mirroria-frontend/src/features/reports/hooks/useDictado.ts`
- Modify: `mirroria-frontend/src/features/admin/pages/ReportesAdminPage.tsx`

**Interfaces:**
- Produces: `useDictado({ onTexto }): { soportado: boolean; escuchando: boolean; alternar: () => void }`

- [ ] **Step 1: El hook**

```ts
// useDictado.ts
import { useEffect, useRef, useState } from "react"

/**
 * Dictado con la Web Speech API del navegador: cero dependencias y la
 * transcripcion ocurre en el cliente, como fija el diseño de BD (el backend
 * recibe texto, nunca audio). Donde la API no exista, `soportado` es false y
 * la pantalla simplemente no muestra el boton.
 */
export function useDictado({ onTexto }: { onTexto: (texto: string) => void }) {
  const [escuchando, setEscuchando] = useState(false)
  const reconocedorRef = useRef<any>(null)

  const Reconocedor =
    typeof window !== "undefined"
      ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
      : undefined
  const soportado = Boolean(Reconocedor)

  useEffect(() => {
    if (!soportado) return
    const r = new Reconocedor()
    r.lang = "es-BO"
    r.continuous = false
    r.interimResults = false
    r.onresult = (e: any) => onTexto(String(e.results[0][0].transcript))
    r.onend = () => setEscuchando(false)
    r.onerror = () => setEscuchando(false)
    reconocedorRef.current = r
    return () => {
      r.abort()
    }
  }, [soportado, Reconocedor, onTexto])

  function alternar() {
    const r = reconocedorRef.current
    if (!r) return
    if (escuchando) {
      r.stop()
      setEscuchando(false)
    } else {
      r.start()
      setEscuchando(true)
    }
  }

  return { soportado, escuchando, alternar }
}
```

- [ ] **Step 2: Conectarlo a la página**

En `ReportesAdminPage.tsx`, agregar:

```tsx
import { Microphone } from "@phosphor-icons/react"
import { useDictado } from "@/features/reports/hooks/useDictado"
```

Dentro del componente, después de los `useState`:

```tsx
  const dictado = useDictado({
    onTexto: (texto) => {
      setPregunta(texto)
      void preguntar(texto)
    },
  })
```

Y dentro del `<form>`, entre el `Input` y el `Button`:

```tsx
        {dictado.soportado && (
          <Button
            type="button"
            variant={dictado.escuchando ? "default" : "outline"}
            size="icon"
            onClick={dictado.alternar}
            aria-label={dictado.escuchando ? "Detener dictado" : "Dictar la pregunta"}
          >
            <Microphone weight={dictado.escuchando ? "fill" : "regular"} />
          </Button>
        )}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: compila.

- [ ] **Step 4: Probar el dictado**

En Brave o Chrome, entrar a `/admin/reportes`, tocar el micrófono, dar permiso y decir
*"cuánto vendí este mes por sucursal"*. El texto tiene que aparecer en el campo y dispararse
la consulta sola.

> Firefox no implementa la Web Speech API: ahí el botón no aparece y el campo de texto sigue
> funcionando. Es el comportamiento esperado, no un defecto.

- [ ] **Step 5: Commit**

```bash
git add src/features/reports/
git commit -m "feat(reportes): dictado por voz con la Web Speech API"
```

---

### Task 21: Cierre — verificación completa y AGENTS.md

**Files:**
- Modify: `mirroria-backend/AGENTS.md`
- Modify: `AGENTS.md` (raíz)

- [ ] **Step 1: Suite completa de las dos apps**

```bash
cd mirroria-backend && npm test && npm run test:e2e && npm run lint
cd ../mirroria-frontend && npx tsc --noEmit && npm run build
```

Expected: todo verde. Anotar el número total de pruebas del backend.

- [ ] **Step 2: Confirmar las 22 tablas**

Run: `docker exec -it $(docker ps -qf name=postgres-db) psql -U mirroria -d mirroria_db -c "\dt"`
Expected: `interacciones_ia` presente. Sigue faltando solo `pagos`.

- [ ] **Step 3: Actualizar `mirroria-backend/AGENTS.md`**

En el árbol de módulos, cambiar la línea de `ia/` de `🚧 placeholder` a:

```
    ├── ia/                        # ✅ implementado — interacciones_ia, reportes dinamicos (CU24)
```

Y agregar una sección de estado siguiendo el formato de las existentes, que diga: las 16
métricas declaradas en `catalogo-metricas.ts`; que el LLM nunca escribe SQL; que el prompt se
deriva del catálogo; las cinco trampas del esquema (§4-bis del spec) y por qué; que
`ENCARGADO_SUCURSAL` queda acotado a su sucursal desde el servidor; y que sin `IA_API_KEY` el
endpoint de ficha manual sigue funcionando.

En el roadmap mermaid, marcar `🤖 ia` con ✅. En el `AGENTS.md` de la raíz, mover `ia` de la
línea de pendientes a la de módulos implementados.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md mirroria-backend/AGENTS.md
git commit -m "docs: modulo ia implementado - CU24 cerrado"
```

- [ ] **Step 5: Avisar lo que queda fuera del plan**

Recordarle a Santiago que el documento entregado del Parcial 1 ahora está desactualizado:
CU24 pasa de *"📐 Diseñado"* a implementado, y las tablas de 21 a 22 de 23. Hay que tocar el
capítulo 5, el apartado 6.7 y la matriz de trazabilidad en `Desktop\mirroria-doc`. Es trabajo
del repo de documentación, no de este.
