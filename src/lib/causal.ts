import { attention, softmax, type Mat } from './transformer'

/** Scores with every future entry (column after the row) replaced by −Infinity, ready for softmax. */
export function maskScores(scores: Mat): Mat {
  return scores.map((row, i) => row.map((v, j) => (j > i ? -Infinity : v)))
}

/** Attempt 1: softmax over everything, then zero the future weights. Rows no longer sum to 1. */
export function zeroFutureAfterSoftmax(scores: Mat): Mat {
  return scores.map((row, i) => softmax(row).map((w, j) => (j > i ? 0 : w)))
}

/** Attempt 2: attempt 1 followed by dividing each row by its new sum. */
export function renormalizeRows(weights: Mat): Mat {
  return weights.map((row) => {
    const s = row.reduce((a, b) => a + b, 0)
    return row.map((w) => w / s)
  })
}

export const rowSums = (m: Mat) => m.map((row) => row.reduce((a, b) => a + b, 0))

/** Number of (query, key) pairs a causal mask allows in a sequence of n tokens: n(n+1)/2. */
export const allowedPairs = (n: number) => (n * (n + 1)) / 2

/** Output of position t when attention is run on the prefix 0..t alone, without any mask. */
export function prefixOutputs(Q: Mat, K: Mat, V: Mat): Mat {
  return Q.map((_, t) => attention(Q.slice(0, t + 1), K.slice(0, t + 1), V.slice(0, t + 1)).out[t])
}
