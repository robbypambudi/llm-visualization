import { gelu, relu } from './transformer'

export type Activation = 'relu' | 'gelu' | 'linear'

export const ACTIVATION_FN: Record<Activation, (x: number) => number> = {
  relu,
  gelu,
  linear: (x) => x,
}

/** Solves (AᵀA + λI)·w = Aᵀy with Gaussian elimination and partial pivoting. Small systems only. */
export function solveRidge(A: readonly number[][], y: readonly number[], lambda = 1e-8): number[] {
  const n = A[0]?.length ?? 0
  const M = Array.from({ length: n }, (_, i) => {
    const row = new Array<number>(n + 1).fill(0)
    for (let j = 0; j < n; j++) {
      let s = i === j ? lambda : 0
      for (const a of A) s += a[i] * a[j]
      row[j] = s
    }
    let s = 0
    A.forEach((a, k) => (s += a[i] * y[k]))
    row[n] = s
    return row
  })
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    ;[M[c], M[p]] = [M[p], M[c]]
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c]
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]
    }
  }
  const w = new Array<number>(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n]
    for (let k = r + 1; k < n; k++) s -= M[r][k] * w[k]
    w[r] = s / M[r][r]
  }
  return w
}

export interface CurveFit {
  knots: number[]
  /** weights[0] is the output bias, weights[i + 1] belongs to neuron i. */
  weights: number[]
  predict: (x: number) => number
  rmse: number
}

/**
 * Fits y ≈ b + Σ wᵢ·act(x − cᵢ) for n hidden neurons whose bends cᵢ are spread evenly over [lo, hi].
 * Only the output weights are fitted (least squares), which is enough to show what the activation buys.
 */
export function fitCurve(target: (x: number) => number, n: number, act: Activation, lo: number, hi: number, samples = 241): CurveFit {
  const f = ACTIVATION_FN[act]
  const knots = Array.from({ length: n }, (_, i) => lo + ((hi - lo) * (i + 0.5)) / n)
  const features = (x: number) => [1, ...knots.map((c) => f(x - c))]
  const xs = Array.from({ length: samples }, (_, k) => lo + ((hi - lo) * k) / (samples - 1))
  const ys = xs.map(target)
  const weights = solveRidge(xs.map(features), ys, 1e-6)
  const predict = (x: number) => features(x).reduce((s, v, i) => s + v * weights[i], 0)
  const rmse = Math.sqrt(xs.reduce((s, x, k) => s + (predict(x) - ys[k]) ** 2, 0) / samples)
  return { knots, weights, predict, rmse }
}
