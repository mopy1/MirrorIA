import * as Haptics from 'expo-haptics';
import * as React from 'react';
import type { FichaPrenda, VarianteFicha } from '@/lib/db/tipos-espejo';

export const libreTotal = (v: VarianteFicha) => v.stock.reduce((s, x) => s + x.libre, 0);

/**
 * Color y talla elegidos. Arranca en `varianteInicial` (escáner o aviso, `?variante=`) o, si no
 * viene, en la primera variante con stock.
 */
export function useSeleccionVariante(ficha: FichaPrenda | null | undefined, varianteInicial?: string) {
  const variantes = ficha?.variantes ?? [];
  const inicial = variantes.find((v) => v.id === varianteInicial) ?? variantes.find((v) => libreTotal(v) > 0) ?? variantes[0];
  // Lo elegido por la clienta; mientras no elija nada manda la variante inicial (sin efectos).
  const [colorElegido, setColor] = React.useState<string | undefined>();
  const [tallaElegida, setTalla] = React.useState<string | undefined>();
  const color = colorElegido ?? inicial?.color;
  const talla = tallaElegida ?? inicial?.talla;

  const colores = [...new Map(variantes.map((v) => [v.color, v.colorHex])).entries()].map(([nombre, hex]) => ({ nombre, hex }));
  const delColor = variantes.filter((v) => v.color === color);
  const variante = delColor.find((v) => v.talla === talla) ?? delColor[0];

  const elegirColor = (c: string) => {
    void Haptics.selectionAsync();
    setColor(c);
    const conStock = variantes.find((v) => v.color === c && v.talla === talla) ?? variantes.find((v) => v.color === c);
    setTalla(conStock?.talla);
  };
  const elegirTalla = (t: string) => {
    void Haptics.selectionAsync();
    setTalla(t);
  };
  return { colores, tallas: delColor, variante, color, elegirColor, elegirTalla };
}
