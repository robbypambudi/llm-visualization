import { randomNormalVector } from './positional'

/** Small dense helpers for the Transformer-block chapters. Plain arrays: the toy sizes are tiny and readable. */
export type Vec = number[]
export type Mat = number[][]

export function matmul(a: Mat, b: Mat): Mat {
  const n = b[0]?.length ?? 0
  return a.map((row) => {
    const out = new Array<number>(n).fill(0)
    row.forEach((v, k) => {
      for (let j = 0; j < n; j++) out[j] += v * b[k][j]
    })
    return out
  })
}

export function transpose(a: Mat): Mat {
  return (a[0] ?? []).map((_, j) => a.map((row) => row[j]))
}

export function dotVec(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

export function norm2(a: ArrayLike<number>): number {
  return Math.sqrt(dotVec(a, a))
}

export function cosineVec(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const d = norm2(a) * norm2(b)
  return d === 0 ? 0 : dotVec(a, b) / d
}

/** Numerically stable softmax. −Infinity entries get weight 0; a row that is entirely −Infinity yields NaN, as in the math. */
export function softmax(xs: readonly number[], temperature = 1): Vec {
  const m = Math.max(...xs)
  const e = xs.map((x) => Math.exp((x - m) / temperature))
  const s = e.reduce((a, b) => a + b, 0)
  return e.map((v) => v / s)
}

export interface AttentionResult {
  /** Scaled (and masked) scores, the input to softmax. Masked entries are −Infinity. */
  scores: Mat
  weights: Mat
  out: Mat
}

/** Scaled dot-product attention, softmax(QKᵀ/√d_k)·V (Vaswani et al., 2017, eq. 1). */
export function attention(Q: Mat, K: Mat, V: Mat, opts: { causal?: boolean; scale?: number } = {}): AttentionResult {
  const dk = Q[0]?.length ?? 1
  const scale = opts.scale ?? 1 / Math.sqrt(dk)
  const scores = Q.map((q, i) => K.map((k, j) => (opts.causal && j > i ? -Infinity : dotVec(q, k) * scale)))
  const weights = scores.map((row) => softmax(row))
  return { scores, weights, out: matmul(weights, V) }
}

export function mean(x: readonly number[]): number {
  return x.reduce((a, b) => a + b, 0) / x.length
}

/** Population variance, as LayerNorm uses it. */
export function variance(x: readonly number[]): number {
  const m = mean(x)
  return mean(x.map((v) => (v - m) ** 2))
}

/** LayerNorm over one token's features (Ba et al., 2016), same form as GPT-2's `norm`. */
export function layerNorm(x: readonly number[], gamma?: readonly number[], beta?: readonly number[], eps = 1e-5): Vec {
  const m = mean(x)
  const inv = 1 / Math.sqrt(variance(x) + eps)
  return x.map((v, i) => (v - m) * inv * (gamma?.[i] ?? 1) + (beta?.[i] ?? 0))
}

export function rms(x: readonly number[]): number {
  return Math.sqrt(mean(x.map((v) => v * v)))
}

/** RMSNorm (Zhang & Sennrich, 2019): no re-centring, no bias. */
export function rmsNorm(x: readonly number[], gamma?: readonly number[], eps = 1e-5): Vec {
  const inv = 1 / Math.sqrt(mean(x.map((v) => v * v)) + eps)
  return x.map((v, i) => v * inv * (gamma?.[i] ?? 1))
}

export const relu = (x: number) => Math.max(0, x)
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
/** tanh approximation of GELU, exactly as in GPT-2's model.py. */
export const gelu = (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)))
/** SiLU / Swish-1, the gate inside SwiGLU. */
export const silu = (x: number) => x * sigmoid(x)

/** Deterministic Gaussian matrix with entries N(0, std²). */
export function randomMatrix(rows: number, cols: number, seed: number, std = 1): Mat {
  const flat = randomNormalVector(rows * cols, seed, std)
  return Array.from({ length: rows }, (_, r) => Array.from(flat.subarray(r * cols, r * cols + cols)))
}
