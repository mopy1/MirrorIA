import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

interface Politica {
  tiendaDe(url: string, cabecera: string | null): string | null
  esCacheable(url: string, tienda: string | null): boolean
  claveCache(url: string, tienda: string): string
  sigueVigente(guardadoEn: number, ahora: number): boolean
}

const entorno = {} as { swPolitica: Politica }
new Function('self', readFileSync(resolve(process.cwd(), 'public/sw-politica.js'), 'utf8'))(entorno)
const p = entorno.swPolitica

const API = 'http://localhost:3000/api/v1'

describe('politica de cache del Service Worker', () => {
  it('guarda lo publico de una tienda', () => {
    expect(p.esCacheable(`${API}/catalogo/productos`, 'luna')).toBe(true)
    expect(p.esCacheable(`${API}/sucursales`, 'luna')).toBe(true)
  })

  it('nunca guarda datos privados', () => {
    for (const ruta of ['/ventas', '/ventas/mias', '/seguridad/auth/me', '/saas/mi-suscripcion', '/dashboard/ejecutivo', '/ml/kpis/rfm', '/pagos/pendientes']) {
      expect(p.esCacheable(`${API}${ruta}`, 'luna')).toBe(false)
    }
  })

  it('sin tienda no guarda nada', () => {
    expect(p.esCacheable(`${API}/catalogo/productos`, null)).toBe(false)
  })

  it('la misma URL de dos tiendas no se mezcla', () => {
    const url = `${API}/catalogo/productos?categoria=1`
    expect(p.claveCache(url, 'luna')).not.toBe(p.claveCache(url, 'sol'))
    expect(new URL(p.claveCache(url, 'luna')).searchParams.get('categoria')).toBe('1')
  })

  it('la ficha publica de la tienda se guarda: sin ella la tienda no abre sin red', () => {
    const url = `${API}/saas/tiendas/luna`
    expect(p.tiendaDe(url, null)).toBe('luna')
    expect(p.esCacheable(url, p.tiendaDe(url, null))).toBe(true)
  })

  it('la cabecera manda sobre la URL, y la disponibilidad de un slug no se guarda', () => {
    expect(p.tiendaDe(`${API}/catalogo/productos`, 'sol')).toBe('sol')
    expect(p.esCacheable(`${API}/saas/tiendas/disponibilidad?slug=x`, p.tiendaDe(`${API}/saas/tiendas/disponibilidad?slug=x`, null))).toBe(false)
  })

  it('lo guardado vence a los 7 dias', () => {
    const dia = 86_400_000
    expect(p.sigueVigente(0, 6 * dia)).toBe(true)
    expect(p.sigueVigente(0, 8 * dia)).toBe(false)
  })
})
