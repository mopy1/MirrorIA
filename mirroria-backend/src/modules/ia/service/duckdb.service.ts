import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';

export interface ProyeccionWhatIf {
  etiqueta: string;
  valorOriginal: number;
  valorProyectado: number;
  deltaAbsoluto: number;
  deltaPorcentual: number;
}

@Injectable()
export class DuckDbService implements OnModuleInit, OnModuleDestroy {
  private instance?: DuckDBInstance;
  private connection?: DuckDBConnection;

  async onModuleInit(): Promise<void> {
    this.instance = await DuckDBInstance.create(':memory:', {
      max_memory: '256MB',
      threads: '2',
    });
    this.connection = await this.instance.connect();
  }

  onModuleDestroy(): void {
    this.connection?.closeSync();
  }

  private async getConn(): Promise<DuckDBConnection> {
    if (!this.connection) {
      await this.onModuleInit();
    }
    return this.connection!;
  }

  async proyectarWhatIf(
    datosBase: Array<{ etiqueta: string; valor: number }>,
    variacionPrecioPct: number,
    variacionVolumenPct: number = 0,
  ): Promise<ProyeccionWhatIf[]> {
    if (!datosBase.length) return [];
    const conn = await this.getConn();
    const tableId = `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    await conn.run(`CREATE TABLE ${tableId} (etiqueta VARCHAR, valor DOUBLE);`);
    for (const d of datosBase) {
      const sanitizedEtiqueta = d.etiqueta.replace(/'/g, "''");
      await conn.run(`INSERT INTO ${tableId} VALUES ('${sanitizedEtiqueta}', ${Number(d.valor) || 0});`);
    }

    const factorP = 1 + variacionPrecioPct / 100;
    const factorV = 1 + variacionVolumenPct / 100;

    const reader = await conn.runAndReadAll(`
      SELECT 
        etiqueta,
        valor::DOUBLE AS valor_original,
        ROUND(valor * ${factorP} * ${factorV}, 2)::DOUBLE AS valor_proyectado,
        ROUND((valor * ${factorP} * ${factorV}) - valor, 2)::DOUBLE AS delta_absoluto,
        ROUND(((${factorP} * ${factorV} - 1) * 100), 2)::DOUBLE AS delta_porcentual
      FROM ${tableId};
    `);

    await conn.run(`DROP TABLE IF EXISTS ${tableId};`);
    const rows = reader.getRowObjects() as Array<{
      etiqueta: string;
      valor_original: number;
      valor_proyectado: number;
      delta_absoluto: number;
      delta_porcentual: number;
    }>;

    return rows.map((r) => ({
      etiqueta: r.etiqueta,
      valorOriginal: r.valor_original,
      valorProyectado: r.valor_proyectado,
      deltaAbsoluto: r.delta_absoluto,
      deltaPorcentual: r.delta_porcentual,
    }));
  }
}
