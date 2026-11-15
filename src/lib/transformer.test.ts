import { describe, expect, it } from 'vitest'
import { attention, gelu, layerNorm, matmul, mean, randomMatrix, rms, rmsNorm, softmax, transpose, variance } from './transformer'

describe('softmax', () => {
  it('sums to 1 and keeps order', () => {
    const p = softmax([1, 2, 3])
    expect(p.reduce((a, b) => a + b)).toBeCloseTo(1, 12)
    expect(p[2]).toBeGreaterThan(p[1])
  })
  it('gives −Infinity a weight of exactly 0', () => {
    expect(softmax([0, -Infinity, 0])).toEqual([0.5, 0, 0.5])
  })
  it('is unchanged by adding a constant', () => {
    const a = softmax([0.3, -1, 2])
    const b = softmax([100.3, 99, 102])
    a.forEach((v, i) => expect(b[i]).toBeCloseTo(v, 12))
  })
})

describe('attention', () => {
  it('averages the values when all keys are identical', () => {
    const Q = [[1, 0]]
    const K = [[1, 1], [1, 1], [1, 1]]
    const V = [[3], [6], [9]]
    expect(attention(Q, K, V).out[0][0]).toBeCloseTo(6, 12)
  })
  it('causal mask zeroes every weight above the diagonal and rows still sum to 1', () => {
    const X = randomMatrix(5, 4, 7)
    const { weights } = attention(X, X, X, { causal: true })
    weights.forEach((row, i) => {
      row.forEach((w, j) => {
        if (j > i) expect(w).toBe(0)
      })
      expect(row.reduce((a, b) => a + b)).toBeCloseTo(1, 12)
    })
    expect(weights[0][0]).toBe(1)
  })
  it('scales scores by 1/√d_k', () => {
    const { scores } = attention([[1, 1, 1, 1]], [[1, 1, 1, 1]], [[0]])
    expect(scores[0][0]).toBeCloseTo(4 / 2, 12)
  })
})

describe('norms', () => {
  const x = [2, -1, 4, 0.5, 3]
  it('LayerNorm gives mean 0 and variance ≈ 1', () => {
    const y = layerNorm(x)
    expect(mean(y)).toBeCloseTo(0, 12)
    expect(variance(y)).toBeCloseTo(1, 4)
  })
  it('LayerNorm ignores shift and scale of its input', () => {
    const a = layerNorm(x)
    const b = layerNorm(x.map((v) => 3 * v + 10))
    a.forEach((v, i) => expect(b[i]).toBeCloseTo(v, 4))
  })
  it('RMSNorm gives RMS ≈ 1, ignores scale but not shift', () => {
    expect(rms(rmsNorm(x))).toBeCloseTo(1, 4)
    const scaled = rmsNorm(x.map((v) => 5 * v))
    rmsNorm(x).forEach((v, i) => expect(scaled[i]).toBeCloseTo(v, 4))
    expect(rmsNorm(x.map((v) => v + 10))[1]).not.toBeCloseTo(rmsNorm(x)[1], 2)
  })
})

describe('helpers', () => {
  it('matmul and transpose agree with hand values', () => {
    expect(matmul([[1, 2]], [[3], [4]])).toEqual([[11]])
    expect(transpose([[1, 2, 3]])).toEqual([[1], [2], [3]])
  })
  it('GELU matches known points of the tanh approximation', () => {
    expect(gelu(0)).toBe(0)
    expect(gelu(1)).toBeCloseTo(0.8412, 4)
    expect(gelu(-1)).toBeCloseTo(-0.1588, 4)
  })
})
