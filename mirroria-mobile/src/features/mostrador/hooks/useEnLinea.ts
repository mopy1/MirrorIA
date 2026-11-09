import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/** Si el teléfono tiene red. `null` mientras no se sabe (se trata como en línea). */
export function useEnLinea(): boolean {
  const [enLinea, setEnLinea] = useState<boolean | null>(null);
  useEffect(() => {
    void NetInfo.fetch().then((e) => setEnLinea(e.isConnected !== false));
    return NetInfo.addEventListener((e) => setEnLinea(e.isConnected !== false));
  }, []);
  return enLinea !== false;
}
