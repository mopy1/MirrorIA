import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bloqueoPago, intervaloConsulta, metodosDisponibles, tokenDelQr, ventaPagada, vistaPago } from './estado-pago.ts';
import { resumenClienta } from './resumen-clienta.ts';

test('la venta manda: PAGADA en el servidor cambia la pantalla sin importar el método', () => {
  assert.equal(vistaPago({ estadoVenta: 'PAGADA', iniciado: 'EFECTIVO' }), 'PAGADA');
  assert.equal(vistaPago({ estadoVenta: 'ENTREGADA', iniciado: null }), 'PAGADA');
  assert.equal(vistaPago({ estadoVenta: 'PENDIENTE', iniciado: 'QR', estadoQr: 'PAGADO' }), 'PAGADA');
  assert.equal(vistaPago({ estadoVenta: 'CANCELADA', iniciado: 'QR' }), 'CANCELADA');
});

test('QR vencido → ofrecer otro; sin cobro iniciado → elegir método', () => {
  assert.equal(vistaPago({ estadoVenta: 'PENDIENTE', iniciado: 'QR', estadoQr: 'VENCIDO' }), 'QR_VENCIDO');
  assert.equal(vistaPago({ estadoVenta: 'PENDIENTE', iniciado: null }), 'ELEGIR');
  assert.equal(vistaPago({ estadoVenta: 'PENDIENTE', iniciado: 'TARJETA' }), 'ESPERANDO');
});

test('polling: solo con red, con cobro iniciado y mientras siga pendiente', () => {
  const base = { estadoVenta: 'PENDIENTE', online: true } as const;
  assert.equal(intervaloConsulta({ ...base, iniciado: 'QR', estadoQr: 'PENDIENTE' }), 3000);
  assert.equal(intervaloConsulta({ ...base, iniciado: 'EFECTIVO' }), 5000);
  assert.equal(intervaloConsulta({ ...base, iniciado: 'TARJETA' }), 4000);
  assert.equal(intervaloConsulta({ ...base, iniciado: null }), false);
  assert.equal(intervaloConsulta({ ...base, online: false, iniciado: 'QR' }), false);
  assert.equal(intervaloConsulta({ ...base, estadoVenta: 'PAGADA', iniciado: 'QR' }), false);
  assert.equal(intervaloConsulta({ ...base, iniciado: 'QR', estadoQr: 'VENCIDO' }), false);
});

test('RN08: sin red no se paga, con el motivo', () => {
  assert.match(bloqueoPago(false, 'PENDIENTE') ?? '', /Sin conexión/);
  assert.equal(bloqueoPago(true, 'PENDIENTE'), null);
  assert.ok(bloqueoPago(true, 'CANCELADA'));
  assert.ok(ventaPagada('DEVUELTA_PARCIAL'));
  assert.ok(!ventaPagada('PENDIENTE'));
});

test('métodos: solo las pasarelas DISPONIBLE, en orden QR · tarjeta · efectivo', () => {
  assert.deepEqual(metodosDisponibles(undefined), ['QR', 'TARJETA', 'EFECTIVO']);
  assert.deepEqual(
    metodosDisponibles([{ id: 'MANUAL', estado: 'DISPONIBLE' }, { id: 'STRIPE', estado: 'NO_CONFIGURADA' }, { id: 'WAYRA', estado: 'DISPONIBLE' }, { id: 'PAYPAL', estado: 'DISPONIBLE' }]),
    ['QR', 'EFECTIVO'],
  );
});

test('token del QR Wayra', () => {
  assert.equal(tokenDelQr('http://localhost:5174/wayra/pagar/abc123?x=1'), 'abc123');
  assert.equal(tokenDelQr('https://otra.cosa/'), null);
});

test('KPIs: compras y ahorro solo de lo pagado; próxima cita = la activa más cercana', () => {
  const r = resumenClienta(
    [
      { estado: 'PAGADA', totalCents: 9000, descuentoCents: 1000 },
      { estado: 'ENTREGADA', totalCents: 5000, descuentoCents: 0 },
      { estado: 'PENDIENTE', totalCents: 3000, descuentoCents: 500 },
      { estado: 'CANCELADA', totalCents: 7000, descuentoCents: 700 },
    ],
    [
      { id: 'b', estado: 'CONFIRMADA', fechaHoraPrevista: '2026-11-09T15:00:00Z' },
      { id: 'a', estado: 'PENDIENTE', fechaHoraPrevista: '2026-11-08T15:00:00Z' },
      { id: 'c', estado: 'COMPLETADA', fechaHoraPrevista: '2026-11-01T15:00:00Z' },
    ],
  );
  assert.deepEqual({ ...r, proxima: r.proxima?.id }, { compras: 2, porPagar: 1, gastadoCents: 14000, ahorroCents: 1000, reservasActivas: 2, proxima: 'a' });
});
