import { describe, expect, it } from 'vitest'
import { allowedPairs, maskScores, prefixOutputs, renormalizeRows, rowSums, zeroFutureAfterSoftmax } from './causal'
import { attention, randomMatrix, softmax } from './transformer'

const Q = randomMatrix(6, 4, 1)
const K = randomMatrix(6, 4, 2)
const V = randomMatrix(6, 4, 3)
const S = attention(Q, K, V).scores

describe('masking attempts', () => {
  it('zeroing after softmax leaves rows that sum to less than 1 (except the last)', () => {
    const sums = rowSums(zeroFutureAfterSoftmax(S))
    sums.slice(0, -1).forEach((s) => expect(s).toBeLessThan(1))
    expect(sums[sums.length - 1]).toBeCloseTo(1, 12)
  })
  it('re-normalising gives exactly the same weights as −∞ before softmax', () => {
    const a = renormalizeRows(zeroFutureAfterSoftmax(S))
    const b = maskScores(S).map((row) => softmax(row))
    a.forEach((row, i) => row.forEach((w, j) => expect(w).toBeCloseTo(b[i][j], 12)))
  })
})

describe('causal attention', () => {
  it('position t gives the same output as running attention on the prefix 0..t alone', () => {
    const full = attention(Q, K, V, { causal: true }).out
    const pre = prefixOutputs(Q, K, V)
    full.forEach((row, t) => row.forEach((v, j) => expect(v).toBeCloseTo(pre[t][j], 12)))
  })
  it('the first token only sees itself, so its output is its own value', () => {
    const out = attention(Q, K, V, { causal: true }).out[0]
    out.forEach((v, j) => expect(v).toBeCloseTo(V[0][j], 12))
  })
  it('counts allowed pairs as n(n+1)/2', () => {
    expect(allowedPairs(7)).toBe(28)
    expect(allowedPairs(1024)).toBe(524800)
  })
})
