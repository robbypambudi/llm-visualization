import type { PeLayout } from '../../lib/positional'

/** Parameters shared by every sinusoidal section on the page. */
export interface PeParams {
  d: number
  seqLen: number
  base: number
  layout: PeLayout
  /** Position highlighted across sections. */
  pos: number
}

export const D_OPTIONS = [16, 32, 64, 128, 256, 512]
export const BASE_OPTIONS = [100, 1000, 10000, 100000]

export const DEFAULT_PARAMS: PeParams = {
  d: 64,
  seqLen: 100,
  base: 10000,
  layout: 'interleaved',
  pos: 10,
}

export const fmt = (v: number, digits = 4) => (Object.is(v, -0) ? 0 : v).toFixed(digits)

/**
 * Formats large/small numbers compactly (wavelengths range from 6 to 60000+).
 * No thousands separator: the app uses '.' as the decimal point everywhere, so
 * a locale-grouped "3.533" would read as a decimal.
 */
export const fmtNum = (v: number) => {
  if (Math.abs(v) >= 1000) return Math.round(v).toString()
  if (Math.abs(v) >= 10) return v.toFixed(1)
  if (Math.abs(v) >= 0.01) return v.toFixed(4)
  return v.toExponential(3)
}

/** Which pair index and function a column holds under the chosen layout. */
export function describeDim(dim: number, d: number, layout: PeParams['layout']) {
  const half = d / 2
  const pair = layout === 'interleaved' ? Math.floor(dim / 2) : dim % half
  const isSin = layout === 'interleaved' ? dim % 2 === 0 : dim < half
  return { pair, isSin }
}
