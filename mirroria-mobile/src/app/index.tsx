import { Redirect } from 'expo-router';
import { useTienda } from '@/contexts/TiendaContext';

/** Redirector sin UI (spec §3.1): sin tienda → /tiendas; con tienda → vitrina con su marca cacheada. */
export default function Index() {
  const { tienda } = useTienda();
  return <Redirect href={tienda ? '/vitrina' : '/tiendas'} />;
}
