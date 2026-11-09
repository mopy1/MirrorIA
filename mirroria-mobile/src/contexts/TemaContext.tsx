import { usePathname } from 'expo-router';
import { vars } from 'nativewind';
import * as React from 'react';
import { useColorScheme, View } from 'react-native';
import { derivarTemaTienda } from '@/lib/tema/derivar-tokens';
import { FAMILIA_PLATAFORMA, FAMILIA_TITULOS } from '@/lib/tema/fuentes';
import { temaPlataforma } from '@/lib/tema/tema-plataforma';
import { aVariables, type TemaResuelto } from '@/lib/tema/tokens';
import { useTienda } from './TiendaContext';

interface ValorTema {
  ambito: 'plataforma' | 'tienda';
  tema: TemaResuelto;
  colores: TemaResuelto['colores'];
  familiaTitulos: string;
}

const Ctx = React.createContext<ValorTema | null>(null);

/**
 * Dos mundos que no se mezclan (spec §7.1): `/tiendas` (o sin tienda) = MirrorIA, que sigue
 * el esquema del sistema; el resto = marca de la tienda con su modo FIJO. Los tokens van
 * como `vars()` de NativeWind en el View raíz: todo `bg-primary`, `text-foreground`… se repinta.
 */
export function TemaProvider({ children }: { children: React.ReactNode }) {
  const { tienda } = useTienda();
  const pathname = usePathname();
  const sistemaOscuro = useColorScheme() === 'dark';
  const ambito: ValorTema['ambito'] = !tienda?.marca || pathname === '/tiendas' ? 'plataforma' : 'tienda';

  const valor = React.useMemo<ValorTema>(() => {
    const marca = tienda?.marca;
    const tema = ambito === 'tienda' && marca ? derivarTemaTienda(marca) : temaPlataforma(sistemaOscuro);
    const familiaTitulos = ambito === 'tienda' && marca ? FAMILIA_TITULOS[marca.fuente] ?? FAMILIA_TITULOS.geist : FAMILIA_PLATAFORMA;
    return { ambito, tema, colores: tema.colores, familiaTitulos };
  }, [ambito, tienda?.marca, sistemaOscuro]);

  const estilo = React.useMemo(() => vars(aVariables(valor.tema)), [valor.tema]);

  return (
    <Ctx.Provider value={valor}>
      <View style={[{ flex: 1, backgroundColor: valor.colores.background }, estilo]}>{children}</View>
    </Ctx.Provider>
  );
}

export function useTema(): ValorTema {
  const v = React.useContext(Ctx);
  if (!v) throw new Error('useTema fuera de TemaProvider');
  return v;
}
