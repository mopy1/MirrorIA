import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Un archivo de punta a punta a la vez. Los .e2e-spec comparten UNA sola
    // base de datos real, y la barrida de vencimientos (`expirarVencidas`) es
    // global por definicion: recorre TODAS las ventas PENDIENTE de la base, no
    // solo las de su fixture. Con los archivos en paralelo, la barrida de
    // `pagos.e2e-spec` alcanzaba la venta PENDIENTE de agosto que siembra
    // `motor-consulta.e2e-spec`, le devolvia el stock y la dejaba CANCELADA:
    // las dos suites fallaban de forma intermitente, cada dos o tres corridas.
    // Hasta que cada archivo tenga su propia base, esto tiene que ser
    // secuencial — y cuesta apenas unos segundos.
    fileParallelism: false,
  },
});
