import type { LucideIcon } from 'lucide-react-native';
import {
  BarChart3, Banknote, Briefcase, CalendarDays, CreditCard, Home, LineChart, Package, Palette,
  Receipt, ShoppingBag, Sparkles, Store, Shirt, Ticket, Truck, Users, Warehouse, Calculator,
} from 'lucide-react-native';
import type { UsuarioRole } from '@/src/features/auth/types/auth.types';

const EQUIPO: UsuarioRole[] = ['ADMIN', 'ENCARGADO_SUCURSAL', 'CAJERO'];
const GESTION: UsuarioRole[] = ['ADMIN', 'ENCARGADO_SUCURSAL'];

export interface ItemMenu {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Quién puede entrar; sin esto, solo ADMIN (igual que el menú de la web). */
  roles?: UsuarioRole[];
}

export interface GrupoMenu {
  id: string;
  title: string;
  icon: LucideIcon;
  items: ItemMenu[];
}

export const MENU_INICIO: ItemMenu = { label: 'Inicio', href: '/admin/dashboard', icon: Home, roles: EQUIPO };

/** Mismo menú que el panel web (admin-sidebar.data.ts), mismas reglas de rol. */
export const MENU_ADMIN: GrupoMenu[] = [
  {
    id: 'ventas',
    title: 'Ventas',
    icon: ShoppingBag,
    items: [
      { label: 'Mostrador', href: '/admin/mostrador', icon: Calculator, roles: ['ADMIN', 'CAJERO'] },
      { label: 'Ventas', href: '/admin/ventas', icon: Receipt, roles: GESTION },
      { label: 'Cobros por confirmar', href: '/admin/cobros', icon: Banknote, roles: ['ADMIN', 'CAJERO'] },
      { label: 'Reservas', href: '/admin/reservas', icon: CalendarDays, roles: EQUIPO },
      { label: 'Cupones', href: '/admin/cupones', icon: Ticket },
    ],
  },
  {
    id: 'productos',
    title: 'Productos',
    icon: Shirt,
    items: [
      { label: 'Catálogo', href: '/admin/catalogo', icon: Package },
      { label: 'Inventario', href: '/admin/inventario', icon: Warehouse, roles: GESTION },
      { label: 'Proveedores', href: '/admin/proveedores', icon: Truck },
    ],
  },
  {
    id: 'analisis',
    title: 'Análisis',
    icon: BarChart3,
    items: [
      { label: 'Reportes con IA', href: '/admin/reportes', icon: Sparkles, roles: GESTION },
      { label: 'Predicciones', href: '/admin/ml', icon: LineChart, roles: GESTION },
    ],
  },
  {
    id: 'negocio',
    title: 'Mi negocio',
    icon: Briefcase,
    items: [
      { label: 'Sucursales', href: '/admin/sucursales', icon: Store },
      { label: 'Equipo y permisos', href: '/admin/usuarios', icon: Users },
      { label: 'Apariencia', href: '/admin/apariencia', icon: Palette },
      { label: 'Plan y suscripción', href: '/admin/suscripcion', icon: CreditCard },
    ],
  },
];

export function puedeVer(item: ItemMenu, role: UsuarioRole | undefined): boolean {
  if (!role) return false;
  return (item.roles ?? ['ADMIN']).includes(role);
}

export function menuParaRol(role: UsuarioRole | undefined): GrupoMenu[] {
  return MENU_ADMIN.map((g) => ({ ...g, items: g.items.filter((i) => puedeVer(i, role)) })).filter(
    (g) => g.items.length > 0
  );
}

/** Todas las rutas del menú (para el test de cero pantallas huérfanas). */
export const RUTAS_MENU = [MENU_INICIO, ...MENU_ADMIN.flatMap((g) => g.items)].map((i) => i.href);
