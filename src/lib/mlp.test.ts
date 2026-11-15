import { describe, expect, it } from 'vitest'
import { fitCurve, solveRidge } from './mlp'

const target = (x: number) => Math.sin(0.9 * x) + 0.1 * x

describe('solveRidge', () => {
  it('recovers exact weights of a consistent system', () => {
    const A = [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ]
    const w = solveRidge(A, [1, 3, 5, 7], 0)
    expect(w[0]).toBeCloseTo(1, 10)
    expect(w[1]).toBeCloseTo(2, 10)
  })
})

describe('fitCurve', () => {
  it('without an activation every neuron count gives the same straight line', () => {
    const a = fitCurve(target, 1, 'linear', -6, 6)
    const b = fitCurve(target, 16, 'linear', -6, 6)
    expect(b.rmse).toBeCloseTo(a.rmse, 4)
    // Straight line: second difference is zero.
    expect(b.predict(-2) - 2 * b.predict(0) + b.predict(2)).toBeCloseTo(0, 4)
  })
  it('with ReLU or GELU more neurons fit better', () => {
    for (const act of ['relu', 'gelu'] as const) {
      const e0 = fitCurve(target, 0, act, -6, 6).rmse
      const e4 = fitCurve(target, 4, act, -6, 6).rmse
      const e16 = fitCurve(target, 16, act, -6, 6).rmse
      expect(e4).toBeLessThan(e0)
      expect(e16).toBeLessThan(e4)
      expect(e16).toBeLessThan(0.05)
    }
  })
})
