/** Minimal sRGB <-> OKLab conversion for perceptually even colour scales. */

type Rgb = [number, number, number]
type Lab = [number, number, number]

export function hexToRgb(hex: string): Rgb {
  const h = hex.trim().replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const toLinear = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

const fromLinear = (v: number) => {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
}

export function rgbToOklab([r, g, b]: Rgb): Lab {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

export function oklabToRgb([L, a, b]: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

/**
 * Diverging scale: value in [-1, 1] → rgb. Two hues with a neutral midpoint,
 * interpolated in OKLab so both arms change lightness evenly.
 * Precomputes a lookup table for fast per-cell use on canvas.
 */
export function makeDivergingScale(neg: string, mid: string, pos: string, steps = 256) {
  const n = rgbToOklab(hexToRgb(neg))
  const z = rgbToOklab(hexToRgb(mid))
  const p = rgbToOklab(hexToRgb(pos))
  const lut = new Uint8ClampedArray(steps * 3)
  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * 2 - 1
    const [from, to, u] = t < 0 ? [z, n, -t] : [z, p, t]
    const lab: Lab = [
      from[0] + (to[0] - from[0]) * u,
      from[1] + (to[1] - from[1]) * u,
      from[2] + (to[2] - from[2]) * u,
    ]
    const [r, g, b] = oklabToRgb(lab)
    lut[i * 3] = r
    lut[i * 3 + 1] = g
    lut[i * 3 + 2] = b
  }
  const rgb = (v: number): Rgb => {
    const t = Math.max(-1, Math.min(1, v))
    const idx = Math.round(((t + 1) / 2) * (steps - 1))
    return [lut[idx * 3], lut[idx * 3 + 1], lut[idx * 3 + 2]]
  }
  const css = (v: number) => {
    const [r, g, b] = rgb(v)
    return `rgb(${r} ${g} ${b})`
  }
  const stops = Array.from({ length: 9 }, (_, i) => css(i / 4 - 1)).join(', ')
  const negStops = Array.from({ length: 5 }, (_, i) => css(i / 4 - 1)).join(', ')
  return {
    rgb,
    css,
    gradient: `linear-gradient(90deg, ${stops})`,
    /** Only the negative arm, for data that is never positive. */
    gradientNeg: `linear-gradient(90deg, ${negStops})`,
  }
}

export type DivergingScale = ReturnType<typeof makeDivergingScale>
