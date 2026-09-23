/**
 * Siembra el catalogo de demostracion contra un MirrorIA que ya este corriendo.
 *
 *   MIRRORIA_EMAIL=... MIRRORIA_PASSWORD=... \
 *   node scripts/sembrar-catalogo.mjs [--api https://mirroria.duckdns.org/api/v1]
 *
 * Las credenciales van por variable de entorno A PROPOSITO: este archivo se
 * commitea y una contrasena de ADMIN no puede quedar en el repo.
 *
 * Es IDEMPOTENTE: antes de crear cada cosa pregunta si ya existe (por slug o
 * por nombre) y la reusa. Se puede correr dos veces sin duplicar nada, que es
 * justo lo que hace falta si se corta a la mitad.
 */
import {
  CATEGORIAS, CIUDADES, COLECCIONES, COLORES, PRODUCTOS, PROVEEDOR,
  RETIRADOS, SUCURSALES, TALLAS, TEMPORADA, foto,
} from './catalogo-demo.mjs'

const API = arg('--api') ?? 'https://mirroria.duckdns.org/api/v1'
const EMAIL = process.env.MIRRORIA_EMAIL
const PASSWORD = process.env.MIRRORIA_PASSWORD
const SOLO_LEER = process.argv.includes('--solo-leer')

function arg(nombre) {
  const i = process.argv.indexOf(nombre)
  return i === -1 ? undefined : process.argv[i + 1]
}

let token = null

async function pedir(metodo, ruta, cuerpo) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  const texto = await r.text()
  if (!r.ok) throw new Error(`${metodo} ${ruta} -> ${r.status} ${texto.slice(0, 300)}`)
  return texto ? JSON.parse(texto) : null
}

const get = (ruta) => pedir('GET', ruta)
const post = (ruta, cuerpo) => pedir('POST', ruta, cuerpo)
const patch = (ruta, cuerpo) => pedir('PATCH', ruta, cuerpo)

/** Compara nombres ignorando acentos, mayusculas y el tipo de guion.
 *
 * Hace falta porque `categorias`, `tallas` y `temporadas` NO tienen PATCH en
 * el backend: si se corrige un acento en el catalogo y la comparacion es
 * literal, el script no encuentra la fila vieja y CREA UNA SEGUNDA. Ya paso:
 * quedaron una talla "Unica" y otra "Única", y dos temporadas. */
function mismoNombre(a, b) {
  const limpiar = (x) => String(x)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // saca los acentos
    .replace(/[–—]/g, '-')                              // guion largo -> corto
    .trim().toLowerCase()
  return limpiar(a) === limpiar(b)
}

/** Devuelve el existente si ya esta (comparando por `clave`), o lo crea. */
async function asegurar(etiqueta, ruta, existentes, clave, valor, cuerpo) {
  const ya = existentes.find((e) => mismoNombre(e[clave], valor))
  if (ya) {
    process.stdout.write('.')
    return { ...ya, _creado: false }
  }
  const nuevo = await post(ruta, cuerpo)
  process.stdout.write('+')
  return { ...nuevo, _creado: true }
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error('Faltan MIRRORIA_EMAIL y MIRRORIA_PASSWORD en el entorno.')
    process.exit(1)
  }

  console.log(`API: ${API}`)
  const auth = await post('/seguridad/auth/login', { email: EMAIL, password: PASSWORD })
  token = auth.accessToken
  console.log(`Sesion: ${auth.usuario.email} (${auth.usuario.role})`)
  if (auth.usuario.role !== 'ADMIN') {
    console.error('Esta cuenta no es ADMIN: el catalogo solo lo puede crear un ADMIN.')
    process.exit(1)
  }

  const antes = {
    productos: (await get('/catalogo/productos')).length,
    sucursales: (await get('/sucursales')).length,
    categorias: (await get('/catalogo/categorias')).length,
  }
  console.log(`Estado actual: ${antes.productos} productos, ${antes.sucursales} sucursales, ` +
              `${antes.categorias} categorias`)
  if (SOLO_LEER) return

  // --- 1. Ciudades y sucursales ------------------------------------------
  process.stdout.write('\nCiudades    ')
  const ciudadesYa = await get('/sucursales/ciudades')
  const ciudades = {}
  for (const c of CIUDADES) {
    const r = await asegurar('ciudad', '/sucursales/ciudades', ciudadesYa, 'nombre', c.nombre, c)
    ciudades[c.nombre] = r.id
  }

  process.stdout.write('\nSucursales  ')
  const sucursalesYa = await get('/sucursales')
  const sucursales = []
  for (const s of SUCURSALES) {
    const r = await asegurar('sucursal', '/sucursales', sucursalesYa, 'nombre', s.nombre, {
      ciudadId: ciudades[s.ciudad],
      nombre: s.nombre,
      direccion: s.direccion,
      telefono: s.telefono,
    })
    sucursales.push(r.id)
  }

  // --- 2. Proveedor, temporada y colecciones ------------------------------
  process.stdout.write('\nProveedor   ')
  const proveedoresYa = await get('/proveedores')
  const proveedor = await asegurar('proveedor', '/proveedores', proveedoresYa,
                                   'razonSocial', PROVEEDOR.razonSocial, PROVEEDOR)

  process.stdout.write('\nTemporada   ')
  const temporadasYa = await get('/catalogo/temporadas')
  const temporada = await asegurar('temporada', '/catalogo/temporadas', temporadasYa,
                                   'nombre', TEMPORADA.nombre, TEMPORADA)

  process.stdout.write('\nColecciones ')
  const coleccionesYa = await get('/catalogo/colecciones')
  const colecciones = {}
  for (const c of COLECCIONES) {
    const r = await asegurar('coleccion', '/catalogo/colecciones', coleccionesYa, 'nombre', c.nombre, {
      nombre: c.nombre,
      descripcion: c.descripcion,
      temporadaId: temporada.id,
      proveedorId: proveedor.id,
    })
    colecciones[c.nombre] = r.id
  }

  // --- 3. Categorias, tallas y colores ------------------------------------
  process.stdout.write('\nCategorias  ')
  const categoriasYa = await get('/catalogo/categorias')
  const categorias = {}
  for (const c of CATEGORIAS) {
    const r = await asegurar('categoria', '/catalogo/categorias', categoriasYa, 'slug', c.slug, c)
    categorias[c.slug] = r.id
  }

  process.stdout.write('\nTallas      ')
  const tallasYa = await get('/catalogo/tallas')
  const tallas = {}
  for (const t of TALLAS) {
    const r = await asegurar('talla', '/catalogo/tallas', tallasYa, 'nombre', t.nombre, t)
    tallas[t.nombre] = r.id
  }

  process.stdout.write('\nColores     ')
  const coloresYa = await get('/catalogo/colores')
  const colores = {}
  for (const c of COLORES) {
    const r = await asegurar('color', '/catalogo/colores', coloresYa, 'nombre', c.nombre, c)
    colores[c.nombre] = r.id
  }

  // --- 4. Productos, variantes y stock -------------------------------------
  process.stdout.write('\nProductos   ')
  const productosYa = await get('/catalogo/productos')
  const variantesNuevas = []
  let corregidos = 0

  for (const p of PRODUCTOS) {
    const prod = await asegurar('producto', '/catalogo/productos', productosYa, 'slug', p.slug, {
      categoriaId: categorias[p.cat],
      coleccionId: colecciones[p.col],
      titulo: p.titulo,
      slug: p.slug,
      descripcion: p.descripcion,
      precioCents: p.precio * 100,
      imagenes: [{ url: foto(p.foto), orden: 0 }],
    })

    // Si ya existia, se le vuelve a escribir el texto y el precio: asi una
    // correccion del catalogo (acentos, copy, precios) se aplica corriendo el
    // script de nuevo, sin borrar nada ni duplicar variantes.
    if (!prod._creado) {
      const cambio = prod.titulo !== p.titulo || prod.descripcion !== p.descripcion ||
                     prod.precioCents !== p.precio * 100
      if (cambio) {
        await patch(`/catalogo/productos/${prod.id}`, {
          titulo: p.titulo,
          descripcion: p.descripcion,
          precioCents: p.precio * 100,
        })
        corregidos++
      }
      continue
    }

    for (const talla of p.tallas) {
      for (const color of p.colores) {
        const sku = `${p.slug}-${talla}-${color}`.toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-').slice(0, 60)
        const v = await post(`/catalogo/productos/${prod.id}/variantes`, {
          tallaId: tallas[talla],
          colorId: colores[color],
          sku,
        })
        variantesNuevas.push(v.id)
      }
    }
  }

  process.stdout.write(`\nStock (${variantesNuevas.length} variantes x ${sucursales.length} sucursales) `)
  let ajustes = 0
  for (const varianteId of variantesNuevas) {
    for (const sucursalId of sucursales) {
      // Cantidades verosimiles y distintas entre sucursales, sin azar: el
      // mismo catalogo sembrado dos veces da el mismo stock.
      const cantidad = 4 + ((varianteId.charCodeAt(0) + sucursalId.charCodeAt(0) + ajustes) % 9)
      await post('/inventario/ajustes', {
        varianteId,
        sucursalId,
        cantidad,
        motivo: 'Carga inicial de catalogo',
      })
      ajustes++
    }
    process.stdout.write('.')
  }

  // --- 5. Retirar lo que ya no va en el catalogo ---------------------------
  // No hay DELETE de productos en el backend, asi que se desactivan: findAll
  // solo devuelve los activos, con lo cual salen de la tienda de inmediato.
  // Como el listado ya viene filtrado por activo, lo que siga apareciendo ahi
  // es justamente lo que falta desactivar (correrlo de nuevo no hace nada).
  console.log('')
  process.stdout.write('Retirados   ')
  let retirados = 0
  const vigentes = await get('/catalogo/productos')
  for (const slug of RETIRADOS) {
    const p = vigentes.find((x) => x.slug === slug)
    if (!p) { process.stdout.write('.'); continue }
    await patch(`/catalogo/productos/${p.id}`, { activo: false })
    process.stdout.write('-')
    retirados++
  }

  const despues = {
    productos: (await get('/catalogo/productos')).length,
    sucursales: (await get('/sucursales')).length,
    categorias: (await get('/catalogo/categorias')).length,
  }
  console.log('\n\nListo.')
  console.log(`  productos  : ${antes.productos} -> ${despues.productos}`)
  console.log(`  sucursales : ${antes.sucursales} -> ${despues.sucursales}`)
  console.log(`  categorias : ${antes.categorias} -> ${despues.categorias}`)
  console.log(`  variantes creadas: ${variantesNuevas.length}, ajustes de stock: ${ajustes}`)
  console.log(`  productos con el texto corregido: ${corregidos}`)
  console.log(`  productos retirados de la tienda: ${retirados}`)
}

main().catch((e) => {
  console.error('\n\nFALLO:', e.message)
  process.exit(1)
})
