import { describe, expect, it } from 'vitest'
import { clasificarRespuesta, esperaReintento } from './clasificar-respuesta'

describe('clasificarRespuesta (Movil_Spec §5.4)', () => {
  it('2xx → CONFIRMADA (MISS o HIT de idempotencia)', () => {
    expect(clasificarRespuesta(201, {})).toEqual({ estado: 'CONFIRMADA' })
    expect(clasificarRespuesta(200, null).estado).toBe('CONFIRMADA')
  })

  it('409 con código de stock → COMPENSADA; otro 409 → RECHAZADA con el mensaje', () => {
    expect(clasificarRespuesta(409, { codigo: 'STOCK_AGOTADO_CONFLICTO' }).estado).toBe('COMPENSADA')
    expect(clasificarRespuesta(409, { message: 'El carrito está vacío' })).toEqual({ estado: 'RECHAZADA', motivo: 'El carrito está vacío' })
  })

  it('409 IDEMPOTENCIA_EN_CURSO, 5xx y error de red → PENDIENTE y reintentar', () => {
    for (const [s, b] of [[409, { codigo: 'IDEMPOTENCIA_EN_CURSO' }], [503, null], [0, null]] as const) {
      expect(clasificarRespuesta(s, b)).toMatchObject({ estado: 'PENDIENTE', accion: 'REINTENTAR' })
    }
  })

  it('401 y 403 de tienda no disponible → PENDIENTE en pausa; otro 403 → RECHAZADA', () => {
    expect(clasificarRespuesta(401, null)).toMatchObject({ estado: 'PENDIENTE', accion: 'PAUSAR' })
    expect(clasificarRespuesta(403, { message: 'La tienda no está disponible' })).toMatchObject({ accion: 'PAUSAR' })
    expect(clasificarRespuesta(403, { message: 'Prohibido' }).estado).toBe('RECHAZADA')
  })

  it('une los message[] de validación y 422 (cuerpo distinto a la clave) → RECHAZADA', () => {
    expect(clasificarRespuesta(400, { message: ['a', 'b'] })).toEqual({ estado: 'RECHAZADA', motivo: 'a, b' })
    expect(clasificarRespuesta(422, null).estado).toBe('RECHAZADA')
  })

  it('backoff 2-4-8-16-30 s con tope y ±20 %', () => {
    expect(esperaReintento(1, 0.5)).toBe(2000)
    expect(esperaReintento(3, 0.5)).toBe(8000)
    expect(esperaReintento(99, 0.5)).toBe(30000)
    expect(esperaReintento(1, 0)).toBe(1600)
    expect(esperaReintento(1, 1)).toBe(2400)
  })
})
