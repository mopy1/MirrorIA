import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// Los íconos traen react-native, que no corre en node: acá solo importan las rutas y los roles.
vi.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icono', has: () => true }));
import { RUTAS_MENU, menuParaRol } from './menu-admin';

describe('menú del panel', () => {
  it('toda ruta del menú tiene su pantalla (cero huérfanas)', () => {
    for (const href of RUTAS_MENU) {
      const archivo = join(__dirname, '../../../../app', `${href}.tsx`);
      expect(existsSync(archivo), href).toBe(true);
    }
  });

  it('la cajera solo ve mostrador, cobros y reservas', () => {
    const items = menuParaRol('CAJERO').flatMap((g) => g.items.map((i) => i.href));
    expect(items).toEqual(['/admin/mostrador', '/admin/cobros', '/admin/reservas']);
  });

  it('la clienta no ve nada', () => {
    expect(menuParaRol('CUSTOMER')).toEqual([]);
  });
});
