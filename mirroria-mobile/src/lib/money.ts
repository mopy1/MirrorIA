const formatter = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
});

/** El backend entrega todo precio como centavos (entero) — nunca dividir "a mano" en un componente. */
export function formatMoney(cents: number): string {
  return formatter.format(cents / 100);
}
