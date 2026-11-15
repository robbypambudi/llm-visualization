import { randomNormalVector } from './positional'
import { cosineVec, norm2 } from './transformer'

/** Toy deep network for the residual demo: d-dimensional tanh layers with Gaussian weights. */
export interface StackParams {
  d: number
  depth: number
  /** Weights are N(0, gain²/d), so gain 1 roughly keeps the vector length per layer. */
  gain: number
  residual: boolean
  /** Size of each residual edit: x ← x + scale · tanh(Wx). Ignored for the plain stack. */
  scale: number
  seed: number
}

export interface StackResult {
  /** cos(x_l, x_0) for l = 0 … depth. */
  cos: number[]
  /** ‖x_l‖ for l = 0 … depth. */
  norm: number[]
  /** log10(‖∂L/∂x_l‖ / ‖∂L/∂x_depth‖) for l = 0 … depth, with L = u · x_depth for a fixed random u. */
  gradLog: number[]
}

/** Unit-variance weights for every layer, generated once per (d, layer, seed) and shared by both stacks. */
const weightCache = new Map<string, Float64Array>()
function unitWeights(d: number, layer: number, seed: number): Float64Array {
  const key = `${d}:${layer}:${seed}`
  let w = weightCache.get(key)
  if (!w) {
    w = randomNormalVector(d * d, seed * 1000 + layer + 1)
    weightCache.set(key, w)
  }
  return w
}

export function simulateStack({ d, depth, gain, residual, scale, seed }: StackParams): StackResult {
  const k = gain / Math.sqrt(d)
  const x0 = Array.from(randomNormalVector(d, seed))
  const xs: number[][] = [x0]
  const acts: number[][] = []
  let x = x0
  for (let l = 0; l < depth; l++) {
    const W = unitWeights(d, l, seed)
    const a = new Array<number>(d)
    for (let i = 0; i < d; i++) {
      let s = 0
      for (let j = 0; j < d; j++) s += W[i * d + j] * x[j]
      a[i] = Math.tanh(k * s)
    }
    acts.push(a)
    x = residual ? x.map((v, i) => v + scale * a[i]) : a
    xs.push(x)
  }

  // Backward pass for L = u · x_depth, written out by hand.
  let g = Array.from(randomNormalVector(d, seed + 777))
  const top = norm2(g)
  const gradLog = new Array<number>(depth + 1)
  gradLog[depth] = 0
  for (let l = depth - 1; l >= 0; l--) {
    const W = unitWeights(d, l, seed)
    const a = acts[l]
    const c = residual ? scale : 1
    const t = a.map((ai, i) => (1 - ai * ai) * g[i] * c * k)
    const back = new Array<number>(d).fill(0)
    for (let i = 0; i < d; i++) {
      if (t[i] === 0) continue
      for (let j = 0; j < d; j++) back[j] += W[i * d + j] * t[i]
    }
    g = residual ? g.map((v, j) => v + back[j]) : back
    const n = norm2(g)
    gradLog[l] = n > 0 ? Math.log10(n / top) : -Infinity
  }

  return { cos: xs.map((v) => cosineVec(v, x0)), norm: xs.map((v) => norm2(v)), gradLog }
}
