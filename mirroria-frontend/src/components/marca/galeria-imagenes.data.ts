// Galería curada (spec Fase 1b §A.5). Verificadas una por una con `curl -sI`
// (las 24 dieron 200 el 2026-11-05): 15 de Unsplash (las 3 que ya usaba el
// proyecto + las 12 del backend, BE1b-4) y 9 de Burst (banco libre de Shopify,
// el mismo del catálogo demo). Ver desviación FE1b-4.
export type GrupoGaleria = "Portada" | "Sucursal" | "Probador" | "Acceso"

export interface ImagenGaleria {
  url: string
  grupo: GrupoGaleria
  descripcion: string
}

const unsplash = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`
const burst = (slug: string) => `https://burst.shopifycdn.com/photos/${slug}.jpg?width=1600`

export const GALERIA: ImagenGaleria[] = [
  { url: unsplash("1441984904996-e0b6ba687e04", 1600, 900), grupo: "Portada", descripcion: "Percheros de una boutique" },
  { url: unsplash("1558769132-cb1aea458c5e", 1600, 900), grupo: "Portada", descripcion: "Prendas colgadas en tonos cálidos" },
  { url: unsplash("1490481651871-ab68de25d43d", 1600, 900), grupo: "Portada", descripcion: "Ropa doblada en tonos tierra" },
  { url: unsplash("1539109136881-3be0616acf4b", 1600, 900), grupo: "Portada", descripcion: "Modelo con abrigo azul" },
  { url: unsplash("1483985988355-763728e1935b", 1600, 900), grupo: "Portada", descripcion: "Mujer con bolsas de compras" },
  { url: unsplash("1485968579580-b6d095142e6e", 1600, 900), grupo: "Portada", descripcion: "Modelo en exterior verde" },
  { url: unsplash("1445205170230-053b83016050", 1600, 900), grupo: "Sucursal", descripcion: "Vidriera de tienda de ropa" },
  { url: unsplash("1434389677669-e08b4cac3105", 1600, 900), grupo: "Sucursal", descripcion: "Tejidos y prendas de abrigo" },
  { url: unsplash("1509631179647-0177331693ae", 1200, 900), grupo: "Probador", descripcion: "Retrato de moda en estudio" },
  { url: unsplash("1529139574466-a303027c1d8b", 1200, 900), grupo: "Probador", descripcion: "Modelo posando con su look" },
  { url: unsplash("1515886657613-9f3515b0c78f", 1200, 1600), grupo: "Acceso", descripcion: "Retrato de moda vertical" },
  { url: unsplash("1469334031218-e382a71b716b", 1200, 1600), grupo: "Acceso", descripcion: "Mujer con vestido en exterior" },
  { url: burst("fashion-model-in-pink"), grupo: "Portada", descripcion: "Modelo de rosa sobre fondo liso" },
  { url: burst("red-on-red-fashion"), grupo: "Portada", descripcion: "Look total en rojo" },
  { url: burst("flowing-summer-green-dress"), grupo: "Portada", descripcion: "Vestido verde de verano" },
  { url: burst("model-in-gold-fashion"), grupo: "Portada", descripcion: "Look dorado de noche" },
  { url: unsplash("1761090617068-f1b3257d27ad", 1600, 900), grupo: "Sucursal", descripcion: "Interior de tienda de ropa" },
  { url: burst("womens-fall-fashion-in-autumn-landscape"), grupo: "Sucursal", descripcion: "Abrigo de otoño al aire libre" },
  { url: burst("slow-fashion-coat"), grupo: "Sucursal", descripcion: "Abrigo largo de lana" },
  { url: unsplash("1753161027818-28b1f73a8fdf", 1200, 900), grupo: "Probador", descripcion: "Clienta en el probador" },
  { url: burst("stylish-woman-smiling"), grupo: "Probador", descripcion: "Mujer sonriendo con su prenda" },
  { url: unsplash("1759630752910-c4f9f628cf88", 1200, 1600), grupo: "Acceso", descripcion: "Retrato editorial vertical" },
  { url: burst("woman-dressed-in-white-leans-against-a-wall"), grupo: "Acceso", descripcion: "Mujer de blanco contra una pared" },
  { url: burst("model-in-neutral-colors-by-window"), grupo: "Acceso", descripcion: "Tonos neutros junto a la ventana" },
]

export const GRUPOS_GALERIA: GrupoGaleria[] = ["Portada", "Sucursal", "Probador", "Acceso"]
