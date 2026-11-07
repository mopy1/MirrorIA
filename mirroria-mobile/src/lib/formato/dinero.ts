/** 125000 → "Bs 1.250,00" (separador de miles punto, decimales coma). */
export function formatoBs(cents: number): string {
  const negativo = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const enteros = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (abs % 100).toString().padStart(2, '0');
  return `${negativo ? '−' : ''}Bs ${enteros},${dec}`;
}
