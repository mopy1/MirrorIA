const formatter = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 2,
})

const formatterEntero = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 0,
})

/** El backend entrega todo precio como centavos (entero) — nunca dividir "a mano" en un componente. */
export function formatMoney(cents: number): string {
  return formatter.format(cents / 100)
}

/** Sin decimales — para espacios angostos donde no entra el monto exacto
 * (ej. el eje de un gráfico). El valor preciso siempre va en el tooltip o
 * la tabla con `formatMoney`, nunca solo acá. */
export function formatMoneyEntero(cents: number): string {
  return formatterEntero.format(cents / 100)
}
