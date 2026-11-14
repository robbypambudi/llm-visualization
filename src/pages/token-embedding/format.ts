/** "38597376" → "38.6 juta". Uses '.' as the decimal point, like the rest of the app. */
export function fmtCount(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} miliar`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} juta`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} ribu`
  return String(n)
}
