/**
 * Catalogo de demostracion de MirrorIA.
 *
 * Las fotos son de Burst (https://burst.shopify.com), el banco gratuito de
 * Shopify: uso comercial libre y pensado justamente para tiendas. NO se usan
 * fotos de tiendas reales, que tienen derechos de autor. Cada una se eligio
 * MIRANDOLA en una hoja de contacto, no por el nombre del archivo.
 *
 * Precios en bolivianos; el backend los guarda en centavos (`precioCents`).
 */
export const foto = (slug) => `https://burst.shopifycdn.com/photos/${slug}.jpg?width=1200`

export const CIUDADES = [
  { nombre: 'Santa Cruz de la Sierra', pais: 'Bolivia' },
  { nombre: 'La Paz', pais: 'Bolivia' },
  { nombre: 'Cochabamba', pais: 'Bolivia' },
]

export const SUCURSALES = [
  {
    ciudad: 'Santa Cruz de la Sierra',
    nombre: 'MirrorIA Equipetrol',
    direccion: 'Av. San Martín esq. Calle J, Equipetrol Norte',
    telefono: '+591 3 341-2280',
  },
  {
    ciudad: 'Santa Cruz de la Sierra',
    nombre: 'MirrorIA Ventura Mall',
    direccion: 'Av. San Martín 1800, Ventura Mall, planta alta',
    telefono: '+591 3 344-9110',
  },
  {
    ciudad: 'La Paz',
    nombre: 'MirrorIA Sopocachi',
    direccion: 'Av. 20 de Octubre 2315, Sopocachi',
    telefono: '+591 2 241-7755',
  },
  {
    ciudad: 'Cochabamba',
    nombre: 'MirrorIA El Prado',
    direccion: 'Av. Ballivián 682, El Prado',
    telefono: '+591 4 425-3390',
  },
]

export const PROVEEDOR = {
  razonSocial: 'Textiles del Valle S.R.L.',
  nit: '1023456789',
  contactoNombre: 'Mariana Ortiz',
  contactoEmail: 'ventas@textilesdelvalle.bo',
  contactoTelefono: '+591 4 452-1180',
}

export const TEMPORADA = {
  nombre: 'Primavera–Verano 2026/2027',
  fechaInicio: '2026-09-01',
  fechaFin: '2027-03-31',
}

export const COLECCIONES = [
  { nombre: 'Esenciales', descripcion: 'Prendas de todos los días, en cortes simples y telas nobles.' },
  { nombre: 'Noche', descripcion: 'Piezas para salir: caídas fluidas, brillos y siluetas marcadas.' },
  { nombre: 'Urbano', descripcion: 'Lo que se usa para trabajar, moverse por la ciudad y seguir de largo.' },
]

export const CATEGORIAS = [
  { nombre: 'Vestidos', slug: 'vestidos' },
  { nombre: 'Blusas y tops', slug: 'blusas-y-tops' },
  { nombre: 'Pantalones y faldas', slug: 'pantalones-y-faldas' },
  { nombre: 'Abrigos y blazers', slug: 'abrigos-y-blazers' },
]

export const TALLAS = [
  { nombre: 'XS', orden: 1 },
  { nombre: 'S', orden: 2 },
  { nombre: 'M', orden: 3 },
  { nombre: 'L', orden: 4 },
  { nombre: 'XL', orden: 5 },
  { nombre: '36', orden: 6 },
  { nombre: '37', orden: 7 },
  { nombre: '38', orden: 8 },
  { nombre: '39', orden: 9 },
  { nombre: '40', orden: 10 },
  { nombre: 'Única', orden: 11 },
]

export const COLORES = [
  { nombre: 'Negro', hexCode: '#111111' },
  { nombre: 'Blanco', hexCode: '#FFFFFF' },
  { nombre: 'Crudo', hexCode: '#F1E9DC' },
  { nombre: 'Gris', hexCode: '#8A8D91' },
  { nombre: 'Verde oliva', hexCode: '#6B705C' },
  { nombre: 'Verde esmeralda', hexCode: '#0F5132' },
  { nombre: 'Mostaza', hexCode: '#D4A017' },
  { nombre: 'Terracota', hexCode: '#C05621' },
  { nombre: 'Rosa palo', hexCode: '#E8C4C4' },
  { nombre: 'Azul marino', hexCode: '#1B2A4A' },
  { nombre: 'Rojo', hexCode: '#A4161A' },
  { nombre: 'Camel', hexCode: '#C19A6B' },
  { nombre: 'Dorado', hexCode: '#C9A227' },
  { nombre: 'Turquesa', hexCode: '#2EC4B6' },
  { nombre: 'Amatista', hexCode: '#7B4B94' },
]

const ROPA = ['XS', 'S', 'M', 'L']
const CALZADO = ['36', '37', '38', '39', '40']
const UNICA = ['Única']

export const PRODUCTOS = [
  // ------------------------------------------------------------- Vestidos
  {
    cat: 'vestidos',
    col: 'Noche',
    titulo: 'Vestido Lumière de lentejuelas',
    slug: 'vestido-lumiere-lentejuelas',
    precio: 890,
    foto: 'shiny-black-cocktail-dress',
    tallas: ROPA,
    colores: ['Negro'],
    descripcion:
      'Vestido corto enteramente bordado en lentejuelas, con breteles finos y caída recta. Va forrado por dentro, para que el brillo quede afuera y la prenda se sienta cómoda toda la noche.',
  },
  {
    cat: 'vestidos',
    col: 'Esenciales',
    titulo: 'Vestido midi Alondra',
    slug: 'vestido-midi-alondra',
    precio: 520,
    foto: 'woman-in-summer-floral-fashion',
    tallas: ROPA,
    colores: ['Negro', 'Rosa palo'],
    descripcion:
      'Midi de viscosa con estampado floral sobre fondo oscuro y escote recto. Cae suelto desde el busto, así que acompaña el movimiento sin marcar.',
  },
  {
    cat: 'vestidos',
    col: 'Esenciales',
    titulo: 'Vestido largo Esmeralda',
    slug: 'vestido-largo-esmeralda',
    precio: 690,
    foto: 'flowing-summer-green-dress',
    tallas: ROPA,
    colores: ['Verde esmeralda'],
    descripcion:
      'Vestido largo de gasa con mangas amplias y cintura al cuerpo. El verde profundo lo vuelve una pieza de ocasión, que igual se puede bajar de tono con sandalias planas.',
  },
  {
    cat: 'vestidos',
    col: 'Esenciales',
    titulo: 'Vestido midi Terracota',
    slug: 'vestido-midi-terracota',
    precio: 560,
    foto: 'woman-in-red-in-yellow-field',
    tallas: ROPA,
    colores: ['Terracota', 'Rojo'],
    descripcion:
      'Midi de algodón liviano con mangas abullonadas y botones al frente. Un básico de temporada cálida que funciona de día y de tarde.',
  },
  {
    cat: 'vestidos',
    col: 'Noche',
    titulo: 'Vestido slip Aurora',
    slug: 'vestido-slip-aurora',
    precio: 640,
    foto: 'fashion-model-in-pink',
    tallas: ROPA,
    colores: ['Rosa palo'],
    descripcion:
      'Slip dress de satén en rosa empolvado, con breteles regulables y terminación al bies. Se lleva solo o bajo un blazer.',
  },
  {
    cat: 'vestidos',
    col: 'Esenciales',
    titulo: 'Vestido Palmares escote V',
    slug: 'vestido-palmares-escote-v',
    precio: 580,
    foto: 'green-summer-fashion-in-park',
    tallas: ROPA,
    colores: ['Verde esmeralda'],
    descripcion:
      'Escote en V pronunciado y falda con vuelo, en verde saturado. Pensado para el calor: tela fresca y espalda despejada.',
  },

  // --------------------------------------------------------- Blusas y tops
  {
    cat: 'blusas-y-tops',
    col: 'Esenciales',
    titulo: 'Blusa de volados Primavera',
    slug: 'blusa-volados-primavera',
    precio: 340,
    foto: 'dressed-for-spring',
    tallas: ROPA,
    colores: ['Blanco'],
    descripcion:
      'Blusa blanca de algodón con volados en los hombros y mangas amplias. Entra en la oficina y sale a cenar sin pasar por casa.',
  },
  {
    cat: 'blusas-y-tops',
    col: 'Noche',
    titulo: 'Top de seda Nocturno',
    slug: 'top-seda-nocturno',
    precio: 290,
    foto: 'womens-black-choker-necklace',
    tallas: ROPA,
    colores: ['Negro'],
    descripcion:
      'Musculosa de seda lavada con cuello alto y espalda al bies. Negro absoluto, sin apliques: la caída de la tela hace todo el trabajo.',
  },
  {
    cat: 'blusas-y-tops',
    col: 'Urbano',
    titulo: 'Blusa satinada Cobalto',
    slug: 'blusa-satinada-cobalto',
    precio: 310,
    foto: 'womens-gold-necklace',
    tallas: ROPA,
    colores: ['Azul marino'],
    descripcion:
      'Satén azul intenso de corte recto y sisa ancha. Combina con jean de tiro alto o con sastrería clara.',
  },
  {
    cat: 'blusas-y-tops',
    col: 'Esenciales',
    titulo: 'Blusa mangas campana Clara',
    slug: 'blusa-mangas-campana-clara',
    precio: 360,
    foto: 'confident-young-woman',
    tallas: ROPA,
    colores: ['Blanco', 'Crudo'],
    descripcion:
      'Blusa blanca con mangas acampanadas y escote cruzado. Liviana, de caída fluida, pensada para climas cálidos.',
  },
  {
    cat: 'blusas-y-tops',
    col: 'Urbano',
    titulo: 'Camisa de lino Sereno',
    slug: 'camisa-lino-sereno',
    precio: 380,
    foto: 'smiling-woman-poses',
    tallas: ROPA,
    colores: ['Blanco'],
    descripcion:
      'Camisa de lino puro, corte holgado y puños abotonados. El lino se arruga: es parte de cómo se ve y de cómo respira.',
  },
  {
    cat: 'blusas-y-tops',
    col: 'Esenciales',
    titulo: 'Remera esencial de algodón',
    slug: 'remera-esencial-algodon',
    precio: 180,
    foto: 'tshirts',
    tallas: ROPA,
    colores: ['Blanco', 'Negro', 'Gris'],
    descripcion:
      'Remera de algodón peinado, cuello redondo reforzado y corte recto. La prenda que sostiene a todas las demás.',
  },

  // -------------------------------------------------- Pantalones y faldas
  {
    cat: 'pantalones-y-faldas',
    col: 'Urbano',
    titulo: 'Pantalón paperbag Oliva',
    slug: 'pantalon-paperbag-oliva',
    precio: 420,
    foto: 'a-model-in-khakis-holding-orchids',
    tallas: ROPA,
    colores: ['Verde oliva'],
    descripcion:
      'Tiro alto con frunce en la cintura y cinto de la misma tela. Cae recto hasta el tobillo y estiliza sin apretar.',
  },
  {
    cat: 'pantalones-y-faldas',
    col: 'Esenciales',
    titulo: 'Pantalón palazzo Crudo',
    slug: 'pantalon-palazzo-crudo',
    precio: 450,
    foto: 'model-laughs-barefoot',
    tallas: ROPA,
    colores: ['Crudo'],
    descripcion:
      'Palazzo de pierna ancha en color crudo, con pinzas al frente. Alarga la silueta y se lleva con sandalia plana o con taco.',
  },
  {
    cat: 'pantalones-y-faldas',
    col: 'Noche',
    titulo: 'Falda de tul Amapola',
    slug: 'falda-tul-amapola',
    precio: 480,
    foto: 'womens-summer-fashion-reds-and-prints',
    tallas: ROPA,
    colores: ['Rojo'],
    descripcion:
      'Falda midi de tul en capas, con cintura elastizada y forro interior. Una pieza declarativa que se equilibra con un top liso.',
  },
  {
    cat: 'pantalones-y-faldas',
    col: 'Urbano',
    titulo: 'Conjunto de rayas Rivera',
    slug: 'conjunto-rayas-rivera',
    precio: 390,
    foto: 'fashion-portrait',
    tallas: ROPA,
    colores: ['Negro', 'Blanco'],
    descripcion:
      'Pantalón de rayas verticales con top al tono. Se usan juntos como conjunto o por separado, cada uno por su lado.',
  },
  {
    cat: 'pantalones-y-faldas',
    col: 'Urbano',
    titulo: 'Enterizo Índigo',
    slug: 'enterizo-indigo',
    precio: 520,
    foto: 'model-in-heels-and-overalls-with-blue',
    tallas: ROPA,
    colores: ['Azul marino'],
    descripcion:
      'Enterizo de pierna ancha con breteles regulables y bolsillos de verdad. Resuelve un día entero con una sola prenda.',
  },
  {
    cat: 'pantalones-y-faldas',
    col: 'Esenciales',
    titulo: 'Conjunto de lino Blanco Sur',
    slug: 'conjunto-lino-blanco-sur',
    precio: 470,
    foto: 'woman-dressed-in-white-leans-against-a-wall',
    tallas: ROPA,
    colores: ['Blanco'],
    descripcion:
      'Remera y short de lino en blanco óptico, de corte holgado. Pensado para el verano cruceño, cuando cualquier otra tela sobra.',
  },

  // -------------------------------------------------- Abrigos y blazers
  {
    cat: 'abrigos-y-blazers',
    col: 'Noche',
    titulo: 'Blazer de cuero Noir',
    slug: 'blazer-cuero-noir',
    precio: 780,
    foto: 'close-up-leather-jacket-over-shoulders',
    tallas: ROPA,
    colores: ['Negro'],
    descripcion:
      'Blazer de cuero ecológico con solapa ancha y caída estructurada. Encima de un vestido de satén cambia por completo el registro.',
  },
  {
    cat: 'abrigos-y-blazers',
    col: 'Urbano',
    titulo: 'Blazer Mostaza',
    slug: 'blazer-mostaza',
    precio: 690,
    foto: 'model-in-gold-fashion',
    tallas: ROPA,
    colores: ['Mostaza'],
    descripcion:
      'Blazer de un solo botón en amarillo mostaza, con hombro suave. El color hace de accesorio: el resto del conjunto puede ir neutro.',
  },
  {
    cat: 'abrigos-y-blazers',
    col: 'Esenciales',
    titulo: 'Trench coat Camel',
    slug: 'trench-coat-camel',
    precio: 980,
    foto: 'slow-fashion-coat',
    tallas: ROPA,
    colores: ['Camel'],
    descripcion:
      'Trench largo en gabardina de algodón, con cinto y tapeta doble. Una prenda de años, no de temporada.',
  },
  {
    cat: 'abrigos-y-blazers',
    col: 'Esenciales',
    titulo: 'Abrigo de lana Invierno',
    slug: 'abrigo-lana-invierno',
    precio: 890,
    foto: 'business-woman-with-wool-hat',
    tallas: ROPA,
    colores: ['Gris'],
    descripcion:
      'Abrigo de mezcla de lana, largo a la rodilla y cuello solapa. Abriga de verdad en el altiplano y no sale arrugado del viaje.',
  },
  {
    cat: 'abrigos-y-blazers',
    col: 'Esenciales',
    titulo: 'Sweater tejido Crudo',
    slug: 'sweater-tejido-crudo',
    precio: 420,
    foto: 'model-in-neutral-colors-by-window',
    tallas: ROPA,
    colores: ['Crudo'],
    descripcion:
      'Tejido de punto grueso en color natural, con cuello redondo amplio. Suave al tacto y sin picazón, para usar sobre la piel.',
  },
  {
    cat: 'abrigos-y-blazers',
    col: 'Noche',
    titulo: 'Traje Carmín',
    slug: 'traje-carmin',
    precio: 1190,
    foto: 'red-on-red-fashion',
    tallas: ROPA,
    colores: ['Rojo'],
    descripcion:
      'Blazer y pantalón al tono en rojo carmín, de corte sastre. Se vende como conjunto y llega listo para una ocasión que se recuerde.',
  },

]

/** Productos que salieron del catalogo.
 *
 * La tienda es EXCLUSIVAMENTE de ropa: el calzado y la bijouterie se retiran.
 * No se borran —el backend no tiene DELETE de productos— sino que el sembrador
 * les pone `activo: false`, y `findAll` del backend solo devuelve los activos,
 * asi que desaparecen de la tienda al instante.
 *
 * Las DOS CATEGORIAS que quedan vacias ('calzado' y 'joyeria-y-accesorios') si
 * hay que borrarlas por SQL: `categorias` no tiene ni PATCH ni DELETE. Ver
 * scripts/corregir-acentos.sql. */
export const RETIRADOS = [
  'stiletto-limon',
  'stiletto-noche',
  'botas-acordonadas-sendero',
  'zapatillas-marina',
  'collar-doble-cadena-dorado',
  'colgante-turquesa-aguas',
  'colgante-amatista-violeta',
  'aros-elefante',
  'set-brazaletes-sol',
  'reloj-bambu-horizonte',
  'lentes-sol-rose',
]

// Se agregan al final para que queden primero en la tienda, que ordena por
// fecha de creacion descendente.
PRODUCTOS.push(
  {
    cat: 'abrigos-y-blazers',
    col: 'Esenciales',
    titulo: 'Sweater de punto Burdeos',
    slug: 'sweater-punto-burdeos',
    precio: 450,
    foto: 'a-model-perched-on-a-stool-smiles',
    tallas: ROPA,
    colores: ['Rojo'],
    descripcion:
      'Tejido de punto fino en burdeos, con mangas tres cuartos y cuello redondo. El tono oscuro lo vuelve facil de combinar con negro o con crudo.',
  },
  {
    cat: 'blusas-y-tops',
    col: 'Urbano',
    titulo: 'Top hombros descubiertos Bahía',
    slug: 'top-hombros-descubiertos-bahia',
    precio: 320,
    foto: 'stylish-woman-smiling',
    tallas: ROPA,
    colores: ['Azul marino', 'Blanco'],
    descripcion:
      'Top de algodon celeste con escote bardot y volado en las mangas. Se lleva con jean de tiro alto y resuelve una tarde de calor.',
  },
  {
    cat: 'pantalones-y-faldas',
    col: 'Urbano',
    titulo: 'Falda estampada Serranía',
    slug: 'falda-estampada-serrania',
    precio: 430,
    foto: 'womens-fall-fashion-in-autumn-landscape',
    tallas: ROPA,
    colores: ['Negro', 'Crudo'],
    descripcion:
      'Falda midi con estampado en blanco y negro y cintura elastizada. Acompana el movimiento sin transparentar, con forro hasta la rodilla.',
  },
  {
    cat: 'vestidos',
    col: 'Esenciales',
    titulo: 'Vestido corto Jazmín',
    slug: 'vestido-corto-jazmin',
    precio: 490,
    foto: 'pink-summer-outfit',
    tallas: ROPA,
    colores: ['Rosa palo'],
    descripcion:
      'Vestido corto de gasa con estampado floral en rosa empolvado y mangas cortas. Liviano y con vuelo, pensado para el dia.',
  },
)
