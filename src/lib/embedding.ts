/**
 * A tiny next-word model used to show how embeddings get their meaning:
 *   logits = E[current word] · W + b,  loss = cross-entropy against the next word.
 * Only the embedding table E and the output layer (W, b) exist — no attention.
 * Real LLMs learn E with the same kind of loss, but through the whole network.
 */

import { mulberry32 } from './positional'

export interface Bigrams {
  vocab: string[]
  /** [context id, next id, count]. */
  pairs: [number, number, number][]
  /** Ids that appear as a context at least once (the others never get an embedding update). */
  contextIds: number[]
}

export function buildBigrams(sentences: string[]): Bigrams {
  const vocab: string[] = []
  const index = new Map<string, number>()
  const id = (w: string) => {
    let i = index.get(w)
    if (i === undefined) {
      i = vocab.length
      vocab.push(w)
      index.set(w, i)
    }
    return i
  }
  const counts = new Map<string, number>()
  for (const s of sentences) {
    const ids = s.split(/\s+/).filter(Boolean).map(id)
    for (let k = 0; k < ids.length - 1; k++) {
      const key = `${ids[k]},${ids[k + 1]}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  const pairs = [...counts].map(([key, c]) => {
    const [a, b] = key.split(',').map(Number)
    return [a, b, c] as [number, number, number]
  })
  const contextIds = [...new Set(pairs.map((p) => p[0]))].sort((a, b) => a - b)
  return { vocab, pairs, contextIds }
}

export interface ToyModel {
  V: number
  d: number
  /** V × d, row-major. */
  E: Float64Array
  /** d × V, row-major. */
  W: Float64Array
  b: Float64Array
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
}

export function initModel(V: number, d: number, seed: number, std = 0.5): ToyModel {
  const rand = mulberry32(seed)
  const E = Float64Array.from({ length: V * d }, () => gaussian(rand) * std)
  const W = Float64Array.from({ length: d * V }, () => gaussian(rand) * std)
  return { V, d, E, W, b: new Float64Array(V) }
}

export function cloneModel(m: ToyModel): ToyModel {
  return { ...m, E: m.E.slice(), W: m.W.slice(), b: m.b.slice() }
}

/** Softmax probabilities of the next word given `ctx`. */
export function predict(m: ToyModel, ctx: number): Float64Array {
  const { V, d, E, W, b } = m
  const logits = new Float64Array(V)
  let max = -Infinity
  for (let j = 0; j < V; j++) {
    let z = b[j]
    for (let k = 0; k < d; k++) z += E[ctx * d + k] * W[k * V + j]
    logits[j] = z
    if (z > max) max = z
  }
  let sum = 0
  for (let j = 0; j < V; j++) {
    logits[j] = Math.exp(logits[j] - max)
    sum += logits[j]
  }
  for (let j = 0; j < V; j++) logits[j] /= sum
  return logits
}

/** One full-batch gradient-descent step on the mean cross-entropy. Returns the loss before the update. */
export function trainStep(m: ToyModel, data: Bigrams, lr: number): number {
  const { V, d, E, W, b } = m
  const gE = new Float64Array(E.length)
  const gW = new Float64Array(W.length)
  const gb = new Float64Array(V)
  let total = 0
  let loss = 0
  for (const [ctx, next, count] of data.pairs) {
    const p = predict(m, ctx)
    loss -= count * Math.log(Math.max(p[next], 1e-12))
    total += count
    p[next] -= 1 // dL/dlogits = softmax − one-hot
    for (let j = 0; j < V; j++) {
      const g = count * p[j]
      gb[j] += g
      for (let k = 0; k < d; k++) {
        gW[k * V + j] += g * E[ctx * d + k]
        gE[ctx * d + k] += g * W[k * V + j]
      }
    }
  }
  const s = lr / total
  for (let i = 0; i < E.length; i++) E[i] -= s * gE[i]
  for (let i = 0; i < W.length; i++) W[i] -= s * gW[i]
  for (let i = 0; i < V; i++) b[i] -= s * gb[i]
  return loss / total
}

export function row(m: ToyModel, i: number): Float64Array {
  return m.E.subarray(i * m.d, i * m.d + m.d)
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let ab = 0
  let aa = 0
  let bb = 0
  for (let i = 0; i < a.length; i++) {
    ab += a[i] * b[i]
    aa += a[i] * a[i]
    bb += b[i] * b[i]
  }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0
}

export function distance(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2
  return Math.sqrt(s)
}
