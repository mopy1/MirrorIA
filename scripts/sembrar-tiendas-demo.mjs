/**
 * Siembra las 2 tiendas demo de la plataforma MirrorIA (Fase 1b §A.7) contra una API corriendo:
 * casa-andina (terracota editorial, claro) y nomada (amarillo nocturno, oscuro).
 *
 *   PLATAFORMA_EMAIL=... PLATAFORMA_PASSWORD=... \
 *   node scripts/sembrar-tiendas-demo.mjs [--api http://localhost:3000/api/v1]
 *
 * Por tienda: alta (POST /saas/tiendas) → la plataforma le pone plan Cadena (marca completa)
 * → PUT /saas/mi-marca → 6 prendas con stock → 2 clientas → 4 compras online pagadas en efectivo
 * (checkout + confirmación del cobro en caja; sin POS),
 * para que el directorio y el panel de plataforma muestren datos reales.
 *
 * IDEMPOTENTE: si la tienda existe entra con su dueña; no duplica prendas, clientas ni ventas
 * (solo vende si la tienda todavía no tiene ventas). La clave de las dueñas demo es pública
 * a propósito (es una demo); la de la plataforma va por entorno.
 */
import { foto, PRODUCTOS } from './catalogo-demo.mjs'

const API = arg('--api') ?? 'http://localhost:3000/api/v1'
const CLAVE_DEMO = 'Mirroria2026!'
const PLAT_EMAIL = process.env.PLATAFORMA_EMAIL
const PLAT_PASS = process.env.PLATAFORMA_PASSWORD

function arg(nombre) {
  const i = process.argv.indexOf(nombre)
  return i === -1 ? undefined : process.argv[i + 1]
}

const unsplash = (id, w, h) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`

/** Marca completa (ActualizarMarcaDto). Fotos verificadas (curl 200, revisadas a ojo). */
const TIENDAS = [
  {
    slug: 'casa-andina',
    nombre: 'Casa Andina',
    ciudad: 'La Paz',
    sucursal: { nombre: 'Casa Andina Sopocachi', direccion: 'Calle Belisario Salinas 520, Sopocachi', telefono: '+591 2 242-1180' },
    duena: { fullName: 'Rosa Quispe Mamani', email: 'rosa@casa-andina.bo' },
    clientas: [['Valeria Choque', 'valeria.choque@demo.bo'], ['Daniela Rojas', 'daniela.rojas@demo.bo']],
    prendas: ['sweater-tejido-crudo', 'abrigo-lana-invierno', 'trench-coat-camel', 'sweater-punto-burdeos',
      'pantalon-palazzo-crudo', 'falda-estampada-serrania'],
    marca: {
      logoUrl: null, faviconUrl: null, colorPrimario: '#B4441B', colorAcento: '#1C3A4A',
      modo: 'CLARO', radio: 'RECTO', fuente: 'playfair',
      hero: {
        imagenUrl: unsplash('1558769132-cb1aea458c5e', 1600, 900),
        titulo: 'Tejidos que abrigan la ciudad.',
        subtitulo: 'Alpaca, lana y algodón trabajados en La Paz. Reservá tu talla y probátela en Sopocachi.',
        ctaTexto: 'Ver la colección', ctaDestino: 'CATALOGO', mostrarProbador: true,
      },
      imagenes: {
        bannerSucursales: unsplash('1445205170230-053b83016050', 1600, 700),
        probador: unsplash('1434389677669-e08b4cac3105', 1200, 900),
        acceso: unsplash('1485968579580-b6d095142e6e', 1200, 1600),
      },
      textos: {
        eslogan: 'Abrigo andino, corte contemporáneo',
        sobreNosotros: 'Somos un taller familiar de La Paz. Diseñamos prendas de punto y abrigos con fibras de la región, en tiradas cortas.',
      },
      contacto: { instagram: 'casaandina.bo', facebook: 'casaandinabo', tiktok: null, whatsapp: '+59171234567', email: 'hola@casa-andina.bo' },
      mostrarInsignia: true,
    },
  },
  {
    slug: 'nomada',
    nombre: 'Nómada Urbana',
    ciudad: 'Santa Cruz',
    sucursal: { nombre: 'Nómada Equipetrol', direccion: 'Av. San Martín 2150, Equipetrol', telefono: '+591 3 345-8820' },
    duena: { fullName: 'Camila Suárez Antelo', email: 'camila@nomada.bo' },
    clientas: [['Luciana Vaca', 'luciana.vaca@demo.bo'], ['Sofía Justiniano', 'sofia.justiniano@demo.bo']],
    prendas: ['blazer-cuero-noir', 'enterizo-indigo', 'remera-esencial-algodon', 'pantalon-paperbag-oliva',
      'top-hombros-descubiertos-bahia', 'conjunto-rayas-rivera'],
    marca: {
      logoUrl: null, faviconUrl: null, colorPrimario: '#E3C14B', colorAcento: '#93D4E6',
      modo: 'OSCURO', radio: 'REDONDO', fuente: 'outfit',
      hero: {
        imagenUrl: unsplash('1509631179647-0177331693ae', 1600, 900),
        titulo: 'Ropa para la noche cruceña.',
        subtitulo: 'Streetwear con actitud. Probátelo con el vestidor virtual antes de salir.',
        ctaTexto: 'Probátelo ya', ctaDestino: 'PROBADOR', mostrarProbador: false,
      },
      imagenes: {
        bannerSucursales: unsplash('1529139574466-a303027c1d8b', 1600, 700),
        probador: unsplash('1515886657613-9f3515b0c78f', 1200, 900),
        acceso: unsplash('1469334031218-e382a71b716b', 1200, 1600),
      },
      textos: { eslogan: 'Streetwear nocturno desde Santa Cruz', sobreNosotros: null },
      contacto: { instagram: 'nomada.urbana', facebook: null, tiktok: 'nomadaurbana', whatsapp: '+59176543210', email: null },
      mostrarInsignia: false,
    },
  },
]

/** catalogo-demo usa 4 categorías; una tienda nueva trae 5 base (vestidos, blusas, pantalones, faldas, accesorios). */
const CATEGORIA = (p) => ({
  vestidos: 'vestidos', 'blusas-y-tops': 'blusas', 'abrigos-y-blazers': 'blusas',
  'pantalones-y-faldas': p.slug.startsWith('falda') ? 'faldas' : 'pantalones',
}[p.cat] ?? 'vestidos')
const COLORES_BASE = ['Negro', 'Beige', 'Blanco', 'Azul marino', 'Rojo', 'Rosa']

async function pedir(metodo, ruta, cuerpo, { token, tienda } = {}) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(tienda ? { 'X-Tenant': tienda } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  const texto = await r.text()
  return { status: r.status, cuerpo: texto ? JSON.parse(texto) : null }
}

async function exigir(metodo, ruta, cuerpo, opciones) {
  const r = await pedir(metodo, ruta, cuerpo, opciones)
  if (r.status >= 400) throw new Error(`${metodo} ${ruta} -> ${r.status} ${JSON.stringify(r.cuerpo).slice(0, 300)}`)
  return r.cuerpo
}

async function asegurarTienda(t, ciudades) {
  const existe = await pedir('GET', `/saas/tiendas/${t.slug}`)
  if (existe.status === 200) {
    const s = await exigir('POST', '/seguridad/auth/login', { email: t.duena.email, password: CLAVE_DEMO }, { tienda: t.slug })
    console.log(`  ${t.slug}: ya existía, sesión de ${t.duena.email}`)
    return { token: s.accessToken, tiendaId: existe.cuerpo.id }
  }
  const alta = await exigir('POST', '/saas/tiendas', {
    planCodigo: 'crecimiento',
    tienda: { nombre: t.nombre, slug: t.slug },
    sucursal: { ...t.sucursal, ciudadId: ciudades[t.ciudad] },
    admin: { ...t.duena, password: CLAVE_DEMO },
  })
  console.log(`  ${t.slug}: creada (${alta.tienda.id})`)
  return { token: alta.accessToken, tiendaId: alta.tienda.id }
}

async function sembrarPrendas(t, sesion) {
  const o = { token: sesion.token, tienda: t.slug }
  const ya = await exigir('GET', '/catalogo/productos', null, o)
  const [categorias, tallas, colores, colecciones, sucursales] = await Promise.all(
    ['/catalogo/categorias', '/catalogo/tallas', '/catalogo/colores', '/catalogo/colecciones', '/sucursales']
      .map((r) => exigir('GET', r, null, o)))
  const variantes = []
  for (const [i, slug] of t.prendas.entries()) {
    const p = PRODUCTOS.find((x) => x.slug === slug)
    if (!p) throw new Error(`Prenda ${slug} no está en catalogo-demo.mjs`)
    let prod = ya.find((x) => x.slug === slug)
    if (!prod) {
      prod = await exigir('POST', '/catalogo/productos', {
        categoriaId: categorias.find((c) => c.slug === CATEGORIA(p)).id,
        coleccionId: colecciones[0].id,
        titulo: p.titulo, slug: p.slug, descripcion: p.descripcion, precioCents: p.precio * 100,
        imagenes: [{ url: foto(p.foto), orden: 0 }],
      }, o)
      const color = colores.find((c) => c.nombre === COLORES_BASE[i % COLORES_BASE.length])
      for (const talla of tallas.filter((x) => ['S', 'M', 'L'].includes(x.nombre))) {
        const v = await exigir('POST', `/catalogo/productos/${prod.id}/variantes`, {
          tallaId: talla.id, colorId: color.id, sku: `${t.slug}-${slug}-${talla.nombre}`.toUpperCase().slice(0, 60),
        }, o)
        await exigir('POST', '/inventario/ajustes', {
          varianteId: v.id, sucursalId: sucursales[0].id, cantidad: 8, motivo: 'Carga inicial demo',
        }, o)
        variantes.push(v.id)
      }
      process.stdout.write('+')
    } else process.stdout.write('.')
  }
  console.log(`  ${t.slug}: prendas listas (${variantes.length} variantes nuevas)`)
  return sucursales[0].id
}

// Sin POS: cada venta sigue el flujo legítimo — la clienta arma el carrito, hace
// checkout y elige efectivo en caja; la dueña (ADMIN, como la cajera) confirma el cobro.
async function sembrarVentas(t, sesion, sucursalId) {
  const o = { token: sesion.token, tienda: t.slug }
  if ((await exigir('GET', '/ventas', null, o)).length > 0) return console.log(`  ${t.slug}: ya tiene ventas`)
  const clientas = []
  for (const [fullName, email] of t.clientas) {
    let r = await pedir('POST', '/seguridad/auth/register', { fullName, email, password: CLAVE_DEMO }, { tienda: t.slug })
    if (r.status !== 201) r = await pedir('POST', '/seguridad/auth/login', { email, password: CLAVE_DEMO }, { tienda: t.slug })
    if (r.status < 400) clientas.push({ id: r.cuerpo.usuario.id, token: r.cuerpo.accessToken })
  }
  if (!clientas.length) return console.log(`  ${t.slug}: sin clientas, no se siembran ventas`)
  const productos = await exigir('GET', '/catalogo/productos?conVariantes=true', null, o)
  const variantes = productos.flatMap((p) => (p.variantes ?? []).map((v) => v.id))
  const planVentas = [[0, 1], [3, 7], [5], [9, 12]]
  let pagadas = 0
  for (const [n, idx] of planVentas.entries()) {
    const items = idx.filter((i) => variantes[i]).map((i) => ({ varianteId: variantes[i], cantidad: 1 }))
    if (!items.length) continue
    const c = clientas[n % clientas.length]
    const oc = { token: c.token, tienda: t.slug }
    for (const it of items) await exigir('POST', `/ventas/carrito/${c.id}/items`, it, oc)
    const venta = await exigir('POST', `/ventas/carrito/${c.id}/checkout`, { sucursalId, canal: 'WEB' }, oc)
    const cobro = await exigir('POST', `/pagos/ventas/${venta.id}/manual`, { metodo: 'EFECTIVO' }, oc)
    await exigir('POST', `/pagos/${cobro.pagoId}/confirmar`, null, o)
    pagadas++
  }
  console.log(`  ${t.slug}: ${pagadas} ventas pagadas en efectivo (checkout + confirmación en caja), ${clientas.length} clientas`)
}

async function main() {
  if (!PLAT_EMAIL || !PLAT_PASS) {
    console.error('Faltan PLATAFORMA_EMAIL y PLATAFORMA_PASSWORD en el entorno.')
    process.exit(1)
  }
  console.log(`API: ${API}`)
  const plat = (await exigir('POST', '/seguridad/auth/login', { email: PLAT_EMAIL, password: PLAT_PASS })).accessToken
  const ciudades = Object.fromEntries((await exigir('GET', '/sucursales/ciudades')).map((c) => [c.nombre, c.id]))
  for (const t of TIENDAS) {
    const sesion = await asegurarTienda(t, ciudades)
    const detalle = await exigir('GET', `/saas/plataforma/inquilinos/${sesion.tiendaId}`, null, { token: plat })
    if (detalle.plan.codigo !== 'cadena') {
      await exigir('PATCH', `/saas/plataforma/inquilinos/${sesion.tiendaId}/plan`, { planCodigo: 'cadena' }, { token: plat })
    }
    await exigir('PUT', '/saas/mi-marca', { nombre: t.nombre, ...t.marca }, { token: sesion.token, tienda: t.slug })
    const sucursalId = await sembrarPrendas(t, sesion)
    await sembrarVentas(t, sesion, sucursalId)
  }
  console.log('\nListo. Dueñas demo (clave Mirroria2026!): ' + TIENDAS.map((t) => `${t.duena.email} (/t/${t.slug})`).join(', '))
}

main().catch((e) => {
  console.error('\nFALLO:', e.message)
  process.exit(1)
})
